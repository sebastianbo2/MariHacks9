import express from "express";
import { ingredients, genericIngredients } from "../api/ai/sampleData.js";
import { generateOptimizedMealPlan, enrichRecipesWithStoreCoords } from "../api/ai/recipeEngine.js";
import { getAllGroceries } from "../api/flipp.js";
import sampleRecipes from "../api/sampleRecipes.js";

const USE_SAMPLE_DATA = true; // 👈 flip to false to use real AI

const router = express.Router();

function normalizePostcode(postcode) {
  return String(postcode ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

router.post("/recipes", async (req, res) => {
  console.log("Someone is connecting!");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  try {
    const {
      userRequest,
      pantryItems = ["salt", "pepper", "vegetable oil", "water"],
      genericIngredientsMarkdown = genericIngredients,
      postcode,
      lat,
      lon,
      address,
      mealsPerFlyer = 3,
    } = req.body ?? {};

    if (!userRequest || typeof userRequest !== "string") {
      return res.status(400).json({
        error: "userRequest is required and must be a string.",
      });
    }

    if (!postcode || typeof postcode !== "string") {
      return res.status(400).json({
        error: "postcode is required and must be a string in format XXX XXX.",
      });
    }

    const userLat = typeof lat === "number" ? lat : parseFloat(lat);
    const userLon = typeof lon === "number" ? lon : parseFloat(lon);

    if (isNaN(userLat) || isNaN(userLon)) {
      return res.status(400).json({
        error: "lat and lon are required and must be valid numbers.",
      });
    }

    // --- Sample data shortcut ---
    if (USE_SAMPLE_DATA) {
      console.log("USE_SAMPLE_DATA is on — enriching sample recipes with real store coords");
      const enriched = await enrichRecipesWithStoreCoords(sampleRecipes, userLat, userLon);
      return res.json(enriched);
    }

    const normalizedPostcode = normalizePostcode(postcode);
    console.log("Normalized postcode:", normalizedPostcode);

    let flyerItems = [];
    try {
      console.log("Fetching flyer items...");
      flyerItems = await getAllGroceries(normalizedPostcode);
      console.log(`Got ${flyerItems.length} flyer items`);
    } catch (flyerErr) {
      console.warn("getAllGroceries failed, using sample data:", flyerErr.message);
      flyerItems = ingredients;
    }

    if (!Array.isArray(flyerItems) || flyerItems.length === 0) {
      console.warn("No flyer items, falling back to sample data");
      flyerItems = ingredients;
    }

    const flyerIds = new Set(
      flyerItems
        .map((item) => item?.flyer_id)
        .filter((id) => id != null)
        .map((id) => Number(id)),
    );
    const flyerCount = flyerIds.size > 0 ? flyerIds.size : 1;
    const perFlyer = Math.max(1, Math.min(5, Number(mealsPerFlyer) || 3));
    const recipeCount = perFlyer * flyerCount;
    console.log(`Generating ${recipeCount} recipes (${flyerCount} flyers × ${perFlyer} per flyer)`);

    console.log("Calling generateOptimizedMealPlan...");
    const recipes = await generateOptimizedMealPlan({
      userRequest,
      userAddress: address,
      userLat,
      userLon,
      pantryItems,
      flyerItems,
      genericIngredientsMarkdown,
      recipeCount,
    });

    console.log(`Returning ${recipes.length} recipes`);
    return res.json(recipes);
  } catch (error) {
    console.error("Error details:");
    console.error("  Message:", error?.message);
    console.error("  Stack:", error?.stack);
    console.error("  Full error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown AI generation error",
      details: error?.cause?.message ?? null,
    });
  }
});

export default router;