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
      flyerItems = ingredients;
    }

    if (!Array.isArray(flyerItems) || flyerItems.length === 0) {
      flyerItems = ingredients;
    }

    const recipes = await generateOptimizedMealPlan({
      userRequest,
      pantryItems,
      flyerItems,
      genericIngredientsMarkdown,
    });

    return res.json(recipes);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown AI generation error",
    });
  }
});

export default router;
