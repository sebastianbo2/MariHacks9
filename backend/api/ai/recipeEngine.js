import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------
const PlannedIngredientSchema = z.object({
  name: z.string(),
  usedQuantity: z.number().positive(),
  unit: z.string().min(1),
  source_tier: z.enum(["SALE", "GENERIC", "PANTRY"]),
  flyer_id: z.number().int().nullable(),
  generic_id: z.string().nullable(),
});

const PlannedRecipeSchema = z.object({
  title: z.string(),
  description: z.string(),
  numberOfServings: z.number().int().min(1),
  prepMinutes: z.number().int().min(0),
  cookMinutes: z.number().int().min(0),
  instructions: z.array(z.string().min(1)).min(2),
  ingredients: z.array(PlannedIngredientSchema).min(1),
});

const GeneratedPlanSchema = z.object({
  recipes: z.array(PlannedRecipeSchema).min(1),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAJOR_GROCERY_STORES = new Set([
  "IGA",
  "Maxi",
  "Provigo",
  "Super C",
  "Walmart",
  "Loblaws",
  "No Frills",
  "FreshCo",
  "Food Basics",
  "Costco",
  "Adonis",
  "PA Supermarche",
]);

const DEPARTMENT_LABEL_FRAGMENTS = [
  "store services",
  "meat",
  "bakery",
  "deli",
  "produce",
  "seafood",
  "floral",
  "pharmacy",
  "dept",
  "department",
  "service",
  "counter",
];

function isDepartmentLabel(merchant) {
  if (!merchant) return true;
  const lower = merchant.toLowerCase();
  return DEPARTMENT_LABEL_FRAGMENTS.some((frag) => lower.includes(frag));
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------
function toRadians(deg) {
  return deg * (Math.PI / 180);
}

function calculateDistance(userLat, userLon, busLat, busLon) {
  const R = 6371;
  const dLat = toRadians(busLat - userLat);
  const dLon = toRadians(busLon - userLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(busLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ---------------------------------------------------------------------------
// Fetch nearby supermarkets using Nominatim
// ---------------------------------------------------------------------------
const STORE_SEARCH_TERMS = [
  "IGA",
  "Maxi",
  "Metro",
  "Super C",
  "Provigo",
  "Walmart",
  "Adonis",
  "PA Supermarche",
  "Loblaws",
];

async function fetchAllNearbyStores(userLat, userLon, radiusMeters = 8000) {
  const radiusDeg = radiusMeters / 111000;
  const viewbox = `${userLon - radiusDeg},${userLat + radiusDeg},${userLon + radiusDeg},${userLat - radiusDeg}`;

  const searches = STORE_SEARCH_TERMS.map(async (storeName) => {
    const params = new URLSearchParams({
      q: `${storeName} supermarket Montreal`,
      format: "json",
      limit: "5",
      viewbox,
      bounded: "1",
    });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: { "User-Agent": "smartcart-app/1.0" },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.map((item) => ({
        name: item.display_name.split(",")[0].trim(),
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }));
    } catch {
      return [];
    }
  });

  const results = [];
  for (const search of searches) {
    results.push(...(await search));
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`Found ${results.length} stores via Nominatim`);
  return results;
}

function findNearestFromList(storeName, allStores, userLat, userLon) {
  if (!allStores || allStores.length === 0) return null;

  const storeNameLower = storeName.toLowerCase();
  const matches = allStores.filter(
    (s) => s.name && s.name.toLowerCase().includes(storeNameLower)
  );

  if (matches.length === 0) return null;

  let nearest = null;
  let nearestDist = Infinity;

  for (const store of matches) {
    if (store.lat == null || store.lon == null) continue;
    const dist = calculateDistance(userLat, userLon, store.lat, store.lon);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = store;
    }
  }

  return nearest ? { lat: nearest.lat, lon: nearest.lon } : null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toPriceNumber(value) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

function normalizeUnit(unit) {
  const normalized = String(unit ?? "unit").trim().toLowerCase();
  if (!normalized) return "unit";

  const aliases = new Map([
    ["grams", "g"],
    ["gram", "g"],
    ["kilograms", "kg"],
    ["kilogram", "kg"],
    ["milliliters", "ml"],
    ["milliliter", "ml"],
    ["liters", "l"],
    ["liter", "l"],
    ["lbs", "lb"],
    ["pieces", "piece"],
    ["pcs", "piece"],
    ["servings", "serving"],
  ]);

  return aliases.get(normalized) ?? normalized;
}

function compactFlyersForPrompt(items, maxRows = 350) {
  const normalized = items
    .map((item) => ({
      flyer_id: item.flyer_id ?? null,
      merchant: item.merchant ?? item.store_name ?? "Unknown",
      name: item.name ?? "Unnamed item",
      price: toPriceNumber(item.price),
      unit: item.unit ?? "unknown",
      valid_to: item.valid_to ?? "unknown",
    }))
    .filter((item) => item.price !== null)
    .sort((a, b) => a.price - b.price)
    .slice(0, maxRows);

  const header =
    "| flyer_id | Merchant | Item Name | Price | Unit | Valid To |\n|---|---|---|---:|---|---|";
  const rows = normalized.map(
    (item) =>
      `| ${item.flyer_id ?? "n/a"} | ${item.merchant} | ${item.name.replaceAll("|", "/")} | ${item.price.toFixed(2)} | ${item.unit} | ${item.valid_to} |`
  );

  return [header, ...rows].join("\n");
}

function parseNumberFromUnitText(unitText) {
  if (typeof unitText !== "string") return null;
  const matched = unitText.match(/[0-9]+(?:[.,][0-9]+)?/);
  if (!matched) return null;
  return toPriceNumber(matched[0].replace(",", "."));
}

function parseGenericMarkdown(genericIngredientsMarkdown = "") {
  const byId = new Map();
  const byName = new Map();
  const lines = String(genericIngredientsMarkdown)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith("|"))
    .filter((line) => !line.startsWith("|---"))
    .filter((line) => !line.toLowerCase().includes("| id |"));

  for (const line of lines) {
    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length < 4) continue;

    const id = cells[0] || null;
    const merchant = cells[1] || null;
    const name = cells[2] || "";
    const price = toPriceNumber(cells[3]);
    const quantity = parseNumberFromUnitText(cells[4]);

    if (price == null) continue;

    const record = {
      id,
      merchant,
      name,
      price,
      soldQuantity: quantity ?? 1,
      soldUnit: normalizeUnit(cells[4] ?? "unit"),
    };

    if (id) byId.set(id.toLowerCase(), record);
    if (name) byName.set(name.toLowerCase(), record);
  }

  return { byId, byName };
}

function normalizeFlyers(flyerItems = []) {
  const byFlyerId = new Map();
  const byName = new Map();

  for (const item of Array.isArray(flyerItems) ? flyerItems : []) {
    const flyerId = item?.flyer_id == null ? null : Number(item.flyer_id);
    const price = toPriceNumber(item?.price);
    const merchant = item?.merchant ?? item?.store_name ?? null;
    const name = String(item?.name ?? "").trim();

    if (price == null) continue;

    const record = {
      flyerId,
      merchant,
      name,
      price,
      soldQuantity: parseNumberFromUnitText(String(item?.unit ?? "")) ?? 1,
      soldUnit: normalizeUnit(item?.unit ?? "unit"),
      lat: toPriceNumber(item?.store_lat) ?? 0,
      lon: toPriceNumber(item?.store_lon) ?? 0,
    };

    if (flyerId != null) byFlyerId.set(flyerId, record);
    if (name) byName.set(name.toLowerCase(), record);
  }

  return { byFlyerId, byName };
}

// ---------------------------------------------------------------------------
// sanitizeRecipeIngredients
//
// This is the ground-truth fix for hallucinated flyer_ids. It runs
// immediately after the AI returns its response, before any price resolution.
// Any SALE ingredient whose flyer_id doesn't exist in our actual flyer index
// is demoted to GENERIC so it can fall back to a generic price instead of
// being matched to a completely wrong flyer item (e.g. wine matched to garlic).
//
// Prompt rules alone cannot reliably stop an LLM from inventing IDs — this
// deterministic post-processing step is the only robust solution.
// ---------------------------------------------------------------------------
function sanitizeRecipeIngredients(recipes, flyerIndex) {
  return recipes.map((recipe) => ({
    ...recipe,
    ingredients: recipe.ingredients.map((ingredient) => {
      if (ingredient.source_tier !== "SALE") return ingredient;

      const flyerId =
        ingredient.flyer_id == null ? null : Number(ingredient.flyer_id);

      if (flyerId == null || !flyerIndex.byFlyerId.has(flyerId)) {
        console.warn(
          `[sanitize] Demoting "${ingredient.name}" from SALE (flyer_id=${ingredient.flyer_id}) to GENERIC — ID not found in flyer index`
        );
        return {
          ...ingredient,
          source_tier: "GENERIC",
          flyer_id: null,
        };
      }

      return ingredient;
    }),
  }));
}

// ---------------------------------------------------------------------------
// resolveIngredientPrice
//
// SALE path uses flyer_id lookup only — no name-based fallback. After
// sanitizeRecipeIngredients runs, any SALE ingredient reaching here is
// guaranteed to have a valid flyer_id. If somehow it still misses (e.g.
// race condition or data gap), we fall through to GENERIC rather than
// guessing a wrong item by name.
// ---------------------------------------------------------------------------
function resolveIngredientPrice(ingredient, flyerIndex, genericIndex) {
  const source = ingredient.source_tier;

  // --- PANTRY: free, no lookup needed ---
  if (source === "PANTRY") {
    return {
      price: 0,
      soldQuantity: ingredient.usedQuantity,
      soldUnit: normalizeUnit(ingredient.unit),
      usedQuantity: ingredient.usedQuantity,
      sourceItemName: `PANTRY: ${ingredient.name}`,
      merchant: null,
      lat: 0,
      lon: 0,
    };
  }

  // --- SALE: flyer_id lookup only, no name-based fallback ---
  if (source === "SALE") {
    const flyerId =
      ingredient.flyer_id == null ? null : Number(ingredient.flyer_id);

    if (flyerId != null && flyerIndex.byFlyerId.has(flyerId)) {
      const match = flyerIndex.byFlyerId.get(flyerId);
      return {
        price: match.price,
        soldQuantity: match.soldQuantity ?? 1,
        soldUnit: normalizeUnit(match.soldUnit),
        usedQuantity: ingredient.usedQuantity,
        sourceItemName: match.name,
        merchant: match.merchant,
        lat: match.lat,
        lon: match.lon,
      };
    }

    // Still not found after sanitization — fall through to GENERIC
    console.warn(
      `[resolveIngredientPrice] SALE ingredient "${ingredient.name}" flyer_id=${ingredient.flyer_id} not in index after sanitization, falling through to GENERIC`
    );
  }

  // --- GENERIC (or SALE fallthrough): generic_id first, then name ---
  const genericId = ingredient.generic_id
    ? String(ingredient.generic_id).toLowerCase()
    : null;

  if (genericId && genericIndex.byId.has(genericId)) {
    const match = genericIndex.byId.get(genericId);
    return {
      price: match.price,
      soldQuantity: match.soldQuantity ?? 1,
      soldUnit: normalizeUnit(match.soldUnit),
      usedQuantity: ingredient.usedQuantity,
      sourceItemName: match.name.toLowerCase().startsWith("generic:")
        ? match.name
        : `GENERIC: ${match.name}`,
      merchant: match.merchant,
      lat: 0,
      lon: 0,
    };
  }

  const genericByName = genericIndex.byName.get(
    String(ingredient.name).toLowerCase()
  );
  if (genericByName) {
    return {
      price: genericByName.price,
      soldQuantity: genericByName.soldQuantity ?? 1,
      soldUnit: normalizeUnit(genericByName.soldUnit),
      usedQuantity: ingredient.usedQuantity,
      sourceItemName: genericByName.name.toLowerCase().startsWith("generic:")
        ? genericByName.name
        : `GENERIC: ${genericByName.name}`,
      merchant: genericByName.merchant,
      lat: 0,
      lon: 0,
    };
  }

  console.warn(
    `[resolveIngredientPrice] No price found for "${ingredient.name}" (tier: ${source}). Ingredient will be dropped.`
  );
  return null;
}

// ---------------------------------------------------------------------------
// mapToFrontendRecipes
// ---------------------------------------------------------------------------
function mapToFrontendRecipes(
  plan,
  flyerItems,
  genericIngredientsMarkdown,
  pantryItems = []
) {
  const flyerIndex = normalizeFlyers(flyerItems);
  const genericIndex = parseGenericMarkdown(genericIngredientsMarkdown);
  const pantrySet = new Set(
    (Array.isArray(pantryItems) ? pantryItems : [])
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean)
  );

  // Default store: first known major chain that isn't a department label
  const defaultStore =
    flyerItems.find((item) => {
      const merchant = String(item?.merchant ?? item?.store_name ?? "").trim();
      return (
        MAJOR_GROCERY_STORES.has(merchant) && !isDepartmentLabel(merchant)
      );
    })?.merchant ??
    flyerItems.find((item) => {
      const merchant = String(item?.merchant ?? item?.store_name ?? "").trim();
      return (
        merchant.length > 0 &&
        merchant.toLowerCase() !== "statcan (qc)" &&
        !isDepartmentLabel(merchant)
      );
    })?.merchant ??
    "IGA";

  return plan.recipes
    .map((recipe) => {
      let dominantMerchant = null;
      let dominantLat = 0;
      let dominantLon = 0;
      const buyMap = new Map();

      const ingredients = recipe.ingredients
        .map((ingredient) => {
          // --- PANTRY ---
          if (ingredient.source_tier === "PANTRY") {
            const pantryName = String(ingredient.name ?? "")
              .trim()
              .toLowerCase();
            if (!pantrySet.has(pantryName)) return null;

            return {
              price: 0,
              name: ingredient.name,
              sourceItemName: `PANTRY: ${ingredient.name}`,
              unit: normalizeUnit(ingredient.unit),
              sourceTier: "PANTRY",
              quantity: round2(Math.max(ingredient.usedQuantity, 0.01)),
              usedQuantity: round2(Math.max(ingredient.usedQuantity, 0.01)),
            };
          }

          // --- SALE / GENERIC ---
          const resolved = resolveIngredientPrice(
            ingredient,
            flyerIndex,
            genericIndex
          );
          if (!resolved || resolved.price == null) return null;

          const merchant = String(resolved.merchant ?? "").trim();
          const isValidStore =
            merchant && merchant.toLowerCase() !== "statcan (qc)";
          const isMajorStore = MAJOR_GROCERY_STORES.has(merchant);
          const isSaleIngredient = ingredient.source_tier === "SALE";

          // Only promote to dominant merchant if it's a real store,
          // not a department label like "store services meat"
          if (
            !dominantMerchant &&
            isSaleIngredient &&
            isValidStore &&
            isMajorStore &&
            !isDepartmentLabel(merchant)
          ) {
            dominantMerchant = resolved.merchant;
            dominantLat = resolved.lat;
            dominantLon = resolved.lon;
          }

          const soldQuantity = round2(
            Math.max(resolved.soldQuantity ?? 1, 0.01)
          );
          const usedQuantity = round2(
            Math.max(ingredient.usedQuantity, 0.01)
          );
          const usedPrice = round2(
            resolved.price * (usedQuantity / soldQuantity)
          );
          const sourceTier = ingredient.source_tier;
          const sourceItemName = String(
            resolved.sourceItemName ?? ingredient.name
          );

          const buyKey = `${sourceTier}|${sourceItemName.toLowerCase()}`;
          if (!buyMap.has(buyKey)) {
            buyMap.set(buyKey, {
              name: sourceItemName,
              unit: normalizeUnit(resolved.soldUnit),
              quantity: soldQuantity,
              sourceTier,
              price: round2(resolved.price),
            });
          }

          return {
            price: usedPrice,
            name: ingredient.name,
            sourceItemName,
            unit: normalizeUnit(ingredient.unit || resolved.soldUnit),
            sourceTier,
            quantity: soldQuantity,
            usedQuantity,
          };
        })
        .filter((item) => item !== null);

      const hasPricedIngredient = ingredients.some((ing) => ing.price > 0);
      if (!hasPricedIngredient) return null;

      const priceForRecipe = round2(
        ingredients.reduce((sum, ing) => sum + ing.price, 0)
      );

      const buyItems = Array.from(buyMap.values());
      const totalPrice = round2(
        buyItems.reduce((sum, item) => sum + item.price, 0)
      );

      return {
        title: recipe.title,
        store_name: dominantMerchant ?? defaultStore,
        store_lat: dominantMerchant ? dominantLat : 0,
        store_lon: dominantMerchant ? dominantLon : 0,
        distanceKm: 1,
        instructions: recipe.instructions,
        buyItems,
        ingredients,
        totalPrice,
        priceForRecipe,
        numberOfServings: recipe.numberOfServings,
        description: recipe.description,
        prepMinutes: recipe.prepMinutes,
        cookMinutes: recipe.cookMinutes,
      };
    })
    .filter((recipe) => recipe !== null);
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function generateOptimizedMealPlan({
  userRequest,
  pantryItems = [],
  flyerItems = [],
  userAddress,
  userLat,
  userLon,
  genericIngredientsMarkdown = "",
  recipeCount = 3,
}) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Missing GOOGLE_GENERATIVE_AI_API_KEY. Set it in backend/.env or your shell environment."
    );
  }

  const flyerMarkdown = compactFlyersForPrompt(
    Array.isArray(flyerItems) ? flyerItems : []
  );
  const pantryList = pantryItems.join(", ");

  const system = `You are a meal planning assistant for Montreal students.
Return JSON only, matching the schema exactly.

Rules:
1) Keep recipes practical and cheap.
2) Use SALE ingredients first when possible.
3) If not found in flyers, use GENERIC ingredients.
4) GENERIC (StatCan QC) is Tier 2 fallback only when flyer data is missing for needed ingredients.
5) PANTRY items are allowed and should be marked as PANTRY.
6) For SALE include flyer_id. For GENERIC include generic_id.
7) Ingredient usedQuantity should be a positive number.
8) Every ingredient must include a relevant unit.
9) Never include a SALE or GENERIC ingredient when its price cannot be found.
10) Every recipe must include step-by-step instructions.
11) Generate exactly ${recipeCount} recipes.
12) Use the names exactly as presented in the flyers if not using GENERIC or PANTRY.`;

  const user = `User intent: ${userRequest}

Pantry (free): ${pantryList}

Flyer items:
${flyerMarkdown}

Generic fallback prices:
${genericIngredientsMarkdown}`;

  // Build flyer index early so sanitization can validate against real data
  const flyerIndex = normalizeFlyers(flyerItems);

  const [{ object }, allNearbyStores] = await Promise.all([
    generateObject({
      model: google("gemini-2.0-flash-lite"),
      schema: GeneratedPlanSchema,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    fetchAllNearbyStores(userLat, userLon, 8000).catch((err) => {
      console.warn("Nominatim fetch failed:", err.message);
      return [];
    }),
  ]);

  const generatedRecipes = Array.isArray(object?.recipes)
    ? object.recipes
    : [];
  const safeCount = Math.max(1, Number(recipeCount) || 3);

  // KEY STEP: sanitize before anything else runs.
  // Demotes any SALE ingredient with a hallucinated or missing flyer_id
  // to GENERIC so it resolves against the generic price table instead of
  // being matched to a random wrong flyer item by name.
  const sanitizedRecipes = sanitizeRecipeIngredients(
    generatedRecipes,
    flyerIndex
  );

  let normalizedRecipes = sanitizedRecipes.slice(0, safeCount);

  if (normalizedRecipes.length > 0 && normalizedRecipes.length < safeCount) {
    const missing = safeCount - normalizedRecipes.length;
    for (let i = 0; i < missing; i++) {
      const cloneSource = normalizedRecipes[i % normalizedRecipes.length];
      normalizedRecipes.push({
        ...cloneSource,
        title: `${cloneSource.title} (Variation ${i + 1})`,
      });
    }
  }

  if (normalizedRecipes.length === 0) {
    throw new Error("AI did not return any recipes.");
  }

  normalizedRecipes = normalizedRecipes
    .map((recipe) => {
      const safeIngredients = Array.isArray(recipe.ingredients)
        ? recipe.ingredients
        : [];
      const safeInstructions = Array.isArray(recipe.instructions)
        ? recipe.instructions
        : [];

      return {
        ...recipe,
        instructions:
          safeInstructions.length > 0
            ? safeInstructions
            : [
                `Prep the ingredients for ${recipe.title}.`,
                `Cook and season, then serve warm.`,
              ],
        ingredients: safeIngredients,
      };
    })
    .filter((recipe) => recipe.ingredients.length > 0);

  if (normalizedRecipes.length === 0) {
    throw new Error("AI did not return any valid ingredients.");
  }

  const mappedRecipes = mapToFrontendRecipes(
    { recipes: normalizedRecipes },
    flyerItems,
    genericIngredientsMarkdown,
    pantryItems
  );

  if (!Array.isArray(mappedRecipes) || mappedRecipes.length === 0) {
    throw new Error(
      "No valid recipes left after removing ingredients with missing prices."
    );
  }

  const enriched = mappedRecipes
    .map((recipe) => {
      if (allNearbyStores.length === 0) return recipe;

      const location = findNearestFromList(
        recipe.store_name,
        allNearbyStores,
        userLat,
        userLon
      );

      if (!location) {
        console.log(
          `Dropping recipe "${recipe.title}" — no nearby ${recipe.store_name} found`
        );
        return null;
      }

      return { ...recipe, store_lat: location.lat, store_lon: location.lon };
    })
    .filter(Boolean);

  return enriched.length > 0 ? enriched : mappedRecipes;
}

// ---------------------------------------------------------------------------
// Exported separately so the router can use it on sample data too
// ---------------------------------------------------------------------------
export async function enrichRecipesWithStoreCoords(recipes, userLat, userLon) {
  let allNearbyStores = [];
  try {
    allNearbyStores = await fetchAllNearbyStores(userLat, userLon, 8000);
    console.log(
      `Found ${allNearbyStores.length} nearby stores from Nominatim`
    );
    console.log("Store names:", allNearbyStores.map((s) => s.name));
  } catch (err) {
    console.warn(
      "Nominatim fetch failed, store coords will be omitted:",
      err.message
    );
  }

  return recipes.map((recipe) => {
    if (allNearbyStores.length === 0) return recipe;

    const location = findNearestFromList(
      recipe.store_name,
      allNearbyStores,
      userLat,
      userLon
    );

    if (!location) {
      console.log(
        `No nearby "${recipe.store_name}" found for "${recipe.title}", keeping coords as 0`
      );
      return recipe;
    }

    return { ...recipe, store_lat: location.lat, store_lon: location.lon };
  });
}