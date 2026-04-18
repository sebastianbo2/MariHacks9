import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const PlannedIngredientSchema = z.object({
  name: z.string(),
  usedQuantity: z.number().positive(),
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
  ingredients: z.array(PlannedIngredientSchema).min(1),
});

const GeneratedPlanSchema = z.object({
  recipes: z.array(PlannedRecipeSchema).min(1),
});

const MAJOR_GROCERY_STORES = new Set([
  "IGA",
  "Maxi",
  "Provigo",
  "Super C",
  "Metro",
  "Walmart",
  "Loblaws",
  "No Frills",
  "FreshCo",
  "Food Basics",
  "Costco",
  "Adonis",
  "PA Supermarche",
]);

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
// Query Overpass directly with coordinates (bypasses geocoding in getNearbyStores)
// ---------------------------------------------------------------------------
async function queryNearbySupermarkets(userLat, userLon, radiusMeters = 5000) {
  const query = `
    [out:json][timeout:25];
    (
      node["shop"="supermarket"](around:${radiusMeters},${userLat},${userLon});
      way["shop"="supermarket"](around:${radiusMeters},${userLat},${userLon});
    );
    out center;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);

  const data = await res.json();
  return data.elements.map((el) => ({
    name: el.tags?.name ?? "",
    lat: el.lat ?? el.center?.lat,
    lon: el.lon ?? el.center?.lon,
  }));
}

// ---------------------------------------------------------------------------
// Given a store name and the user's coordinates, find the nearest OSM match
// ---------------------------------------------------------------------------
async function findNearestStoreLocation(storeName, userLat, userLon, radiusMeters = 5000) {
  try {
    const nearby = await queryNearbySupermarkets(userLat, userLon, radiusMeters);
    if (!nearby || nearby.length === 0) return null;

    const storeNameLower = storeName.toLowerCase();
    const matches = nearby.filter(
      (s) => s.name && s.name.toLowerCase().includes(storeNameLower),
    );

    // Fall back to all nearby stores if no name match
    const candidates = matches.length > 0 ? matches : nearby;

    let nearest = null;
    let nearestDist = Infinity;

    for (const store of candidates) {
      if (store.lat == null || store.lon == null) continue;
      const dist = calculateDistance(userLat, userLon, store.lat, store.lon);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = store;
      }
    }

    return nearest ? { lat: nearest.lat, lon: nearest.lon } : null;
  } catch (err) {
    console.warn(`findNearestStoreLocation failed for "${storeName}":`, err.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers (unchanged)
// ---------------------------------------------------------------------------
function toPriceNumber(value) {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function round2(value) {
  return Math.round(value * 100) / 100;
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
      `| ${item.flyer_id ?? "n/a"} | ${item.merchant} | ${item.name.replaceAll("|", "/")} | ${item.price.toFixed(2)} | ${item.unit} | ${item.valid_to} |`,
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

    const record = { id, merchant, name, price, quantity: quantity ?? 1 };

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
      quantity: 1,
      lat: toPriceNumber(item?.store_lat) ?? 0,
      lon: toPriceNumber(item?.store_lon) ?? 0,
    };

    if (flyerId != null) byFlyerId.set(flyerId, record);
    if (name) byName.set(name.toLowerCase(), record);
  }

  return { byFlyerId, byName };
}

function resolveIngredientPrice(ingredient, flyerIndex, genericIndex) {
  const source = ingredient.source_tier;

  if (source === "PANTRY") {
    return {
      price: 0,
      quantity: ingredient.usedQuantity,
      usedQuantity: ingredient.usedQuantity,
      merchant: null,
      lat: 0,
      lon: 0,
    };
  }

  if (source === "SALE") {
    const flyerId = ingredient.flyer_id == null ? null : Number(ingredient.flyer_id);
    if (flyerId != null && flyerIndex.byFlyerId.has(flyerId)) {
      const match = flyerIndex.byFlyerId.get(flyerId);
      return {
        price: match.price,
        quantity: ingredient.usedQuantity,
        usedQuantity: ingredient.usedQuantity,
        merchant: match.merchant,
        lat: match.lat,
        lon: match.lon,
      };
    }

    const byName = flyerIndex.byName.get(String(ingredient.name).toLowerCase());
    if (byName) {
      return {
        price: byName.price,
        quantity: ingredient.usedQuantity,
        usedQuantity: ingredient.usedQuantity,
        merchant: byName.merchant,
        lat: byName.lat,
        lon: byName.lon,
      };
    }
  }

  const genericId = ingredient.generic_id ? String(ingredient.generic_id).toLowerCase() : null;
  if (genericId && genericIndex.byId.has(genericId)) {
    const match = genericIndex.byId.get(genericId);
    return {
      price: match.price,
      quantity: ingredient.usedQuantity,
      usedQuantity: ingredient.usedQuantity,
      merchant: match.merchant,
      lat: 0,
      lon: 0,
    };
  }

  const genericByName = genericIndex.byName.get(String(ingredient.name).toLowerCase());
  if (genericByName) {
    return {
      price: genericByName.price,
      quantity: ingredient.usedQuantity,
      usedQuantity: ingredient.usedQuantity,
      merchant: genericByName.merchant,
      lat: 0,
      lon: 0,
    };
  }

  return null;
}

function mapToFrontendRecipes(plan, flyerItems, genericIngredientsMarkdown, pantryItems = []) {
  const flyerIndex = normalizeFlyers(flyerItems);
  const genericIndex = parseGenericMarkdown(genericIngredientsMarkdown);
  const pantrySet = new Set(
    (Array.isArray(pantryItems) ? pantryItems : [])
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean),
  );

  const defaultStore =
    flyerItems.find((item) => {
      const merchant = String(item?.merchant ?? item?.store_name ?? "").trim();
      return MAJOR_GROCERY_STORES.has(merchant);
    })?.merchant ??
    flyerItems.find((item) => {
      const merchant = String(item?.merchant ?? item?.store_name ?? "").trim();
      return merchant.length > 0 && merchant.toLowerCase() !== "statcan (qc)";
    })?.merchant ??
    "IGA";

  return plan.recipes
    .map((recipe) => {
      let dominantMerchant = null;
      let dominantLat = 0;
      let dominantLon = 0;

      const ingredients = recipe.ingredients
        .map((ingredient) => {
          if (ingredient.source_tier === "PANTRY") {
            const pantryName = String(ingredient.name ?? "").trim().toLowerCase();
            if (!pantrySet.has(pantryName)) return null;
            return {
              price: 0,
              name: ingredient.name,
              quantity: round2(Math.max(ingredient.usedQuantity, 0.01)),
              usedQuantity: round2(Math.max(ingredient.usedQuantity, 0.01)),
            };
          }

          const resolved = resolveIngredientPrice(ingredient, flyerIndex, genericIndex);
          if (!resolved || resolved.price == null) return null;

          const merchant = String(resolved.merchant ?? "").trim();
          const isValidStore = merchant && merchant.toLowerCase() !== "statcan (qc)";
          const isMajorStore = MAJOR_GROCERY_STORES.has(merchant);
          const isSaleIngredient = ingredient.source_tier === "SALE";

          if (!dominantMerchant && isSaleIngredient && isValidStore && isMajorStore) {
            dominantMerchant = resolved.merchant;
            dominantLat = resolved.lat;
            dominantLon = resolved.lon;
          }

          return {
            price: round2(resolved.price),
            name: ingredient.name,
            quantity: round2(Math.max(ingredient.usedQuantity, 0.01)),
            usedQuantity: round2(Math.max(ingredient.usedQuantity, 0.01)),
          };
        })
        .filter((item) => item !== null);

      const hasPricedIngredient = ingredients.some((ingredient) => ingredient.price > 0);
      if (!hasPricedIngredient) return null;

      const priceForRecipe = round2(
        ingredients.reduce((sum, ingredient) => {
          if (!ingredient.quantity) return sum;
          return sum + ingredient.price * (ingredient.usedQuantity / ingredient.quantity);
        }, 0),
      );

      return {
        title: recipe.title,
        store_name: dominantMerchant ?? defaultStore,
        // lat/lon are placeholders here — overwritten below with real OSM coords
        store_lat: dominantMerchant ? dominantLat : 0,
        store_lon: dominantMerchant ? dominantLon : 0,
        ingredients,
        totalPrice: priceForRecipe,
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
<<<<<<< Updated upstream
  pantryItems,
  flyerItems,
=======
  userAddress,           // full address string, e.g. "4800 Rue Sherbrooke Ouest, Montréal"
  userLat,               // number
  userLon,               // number
  pantryItems = ["salt", "pepper", "vegetable oil", "water"],
  flyerItems = [],
>>>>>>> Stashed changes
  genericIngredientsMarkdown = "",
  recipeCount = 3,
}) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error(
      "Missing GOOGLE_GENERATIVE_AI_API_KEY. Set it in backend/.env or your shell environment.",
    );
  }

  const flyerMarkdown = compactFlyersForPrompt(Array.isArray(flyerItems) ? flyerItems : []);
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
8) Never include a SALE or GENERIC ingredient when its price cannot be found.
9) Generate exactly ${recipeCount} recipes.`;

  const user = `User intent: ${userRequest}

Pantry (free): ${pantryList}

Flyers:
${flyerMarkdown}

Generic fallback table:
${genericIngredientsMarkdown}`;

  const { object } = await generateObject({
    model: google("gemini-3.1-flash-lite-preview"),
    schema: GeneratedPlanSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const generatedRecipes = Array.isArray(object?.recipes) ? object.recipes : [];
  const safeCount = Math.max(1, Number(recipeCount) || 3);

  let normalizedRecipes = generatedRecipes.slice(0, safeCount);
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

  const mappedRecipes = mapToFrontendRecipes(
    { recipes: normalizedRecipes },
    flyerItems,
    genericIngredientsMarkdown,
    pantryItems,
  );

  if (!Array.isArray(mappedRecipes) || mappedRecipes.length === 0) {
    throw new Error("No valid recipes left after removing ingredients with missing prices.");
  }

  // -------------------------------------------------------------------------
  // Enrich each recipe with real OSM store coordinates nearest to the user
  // We deduplicate by store name so we only call OSM once per unique store
  // -------------------------------------------------------------------------
  const storeCache = new Map(); // store_name → { lat, lon } | null

  const enriched = await Promise.all(
    mappedRecipes.map(async (recipe) => {
      const storeName = recipe.store_name;

      if (!storeCache.has(storeName)) {
        const location = await findNearestStoreLocation(storeName, userLat, userLon);
        storeCache.set(storeName, location);
      }

      const location = storeCache.get(storeName);

      return {
        ...recipe,
        store_lat: location?.lat ?? recipe.store_lat,
        store_lon: location?.lon ?? recipe.store_lon,
      };
    }),
  );

  return enriched;
}