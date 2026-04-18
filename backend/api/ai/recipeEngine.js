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

  const header = "| flyer_id | Merchant | Item Name | Price | Unit | Valid To |\\n|---|---|---|---:|---|---|";
  const rows = normalized.map(
    (item) =>
      `| ${item.flyer_id ?? "n/a"} | ${item.merchant} | ${item.name.replaceAll("|", "/")} | ${item.price.toFixed(2)} | ${item.unit} | ${item.valid_to} |`,
  );

  return [header, ...rows].join("\\n");
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
      quantity: quantity ?? 1,
    };

    if (id) {
      byId.set(id.toLowerCase(), record);
    }

    if (name) {
      byName.set(name.toLowerCase(), record);
    }
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

    if (flyerId != null) {
      byFlyerId.set(flyerId, record);
    }

    if (name) {
      byName.set(name.toLowerCase(), record);
    }
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

  return {
    price: 0,
    quantity: ingredient.usedQuantity,
    usedQuantity: ingredient.usedQuantity,
    merchant: null,
    lat: 0,
    lon: 0,
  };
}

function mapToFrontendRecipes(plan, flyerItems, genericIngredientsMarkdown) {
  const flyerIndex = normalizeFlyers(flyerItems);
  const genericIndex = parseGenericMarkdown(genericIngredientsMarkdown);

  return plan.recipes.map((recipe) => {
    let dominantMerchant = null;
    let dominantLat = 0;
    let dominantLon = 0;

    const ingredients = recipe.ingredients.map((ingredient) => {
      const resolved = resolveIngredientPrice(ingredient, flyerIndex, genericIndex);

      if (!dominantMerchant && resolved.merchant) {
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
    });

    const priceForRecipe = round2(
      ingredients.reduce((sum, ingredient) => {
        if (!ingredient.quantity) return sum;
        return sum + ingredient.price * (ingredient.usedQuantity / ingredient.quantity);
      }, 0),
    );

    return {
      title: recipe.title,
      store_name: dominantMerchant ?? "Unknown",
      store_lat: dominantLat,
      store_lon: dominantLon,
      ingredients,
      totalPrice: priceForRecipe,
      priceForRecipe,
      numberOfServings: recipe.numberOfServings,
      description: recipe.description,
      prepMinutes: recipe.prepMinutes,
      cookMinutes: recipe.cookMinutes,
    };
  });
}

export async function generateOptimizedMealPlan({
  userRequest,
  pantryItems = ["salt", "pepper", "vegetable oil", "water"],
  flyerItems = [],
  genericIngredientsMarkdown = "",
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
4) PANTRY items are allowed and should be marked as PANTRY.
5) For SALE include flyer_id. For GENERIC include generic_id.
6) Ingredient usedQuantity should be a positive number.`;

  const user = `User intent: ${userRequest}

Pantry (free): ${pantryList}

Flyers:
${flyerMarkdown}

Generic fallback table:
${genericIngredientsMarkdown}`;

  const { object } = await generateObject({
    model: google("gemini-2.5-flash-lite"),
    schema: GeneratedPlanSchema,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  return mapToFrontendRecipes(object, flyerItems, genericIngredientsMarkdown);
}
