import express from "express";
import { ingredients, genericIngredients } from "../api/ai/sampleData.js";
import { generateOptimizedMealPlan } from "../api/ai/recipeEngine.js";
import { getAllGroceries } from "../api/flipp.js";

const router = express.Router();

function normalizePostcode(postcode) {
  return String(postcode ?? "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

router.post("/recipes", async (req, res) => {
  try {
    const {
      userRequest,
      pantryItems = ["salt", "pepper", "vegetable oil", "water"],
      genericIngredientsMarkdown = genericIngredients,
      postcode,
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

    const normalizedPostcode = normalizePostcode(postcode);
    let flyerItems = [];
    try {
      flyerItems = await getAllGroceries(normalizedPostcode);
    } catch {
      console.log("Fallback: sample data ingredients")
      flyerItems = ingredients;
    }

    if (!Array.isArray(flyerItems) || flyerItems.length === 0) {
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

    const recipes = await generateOptimizedMealPlan({
      userRequest,
      pantryItems,
      flyerItems,
      genericIngredientsMarkdown,
      recipeCount,
    });

    return res.json(recipes);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown AI generation error",
    });
  }
});

export default router;
