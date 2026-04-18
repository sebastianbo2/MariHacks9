import { ingredients, genericIngredients } from "./sampleData.js";
import { generateOptimizedMealPlan } from "./recipeEngine.js";

const plan = await generateOptimizedMealPlan({
  userRequest: "Build me affordable high-protein meals for this week in Montreal.",
  pantryItems: ["salt", "pepper", "vegetable oil", "water", "granulated sugar", "all-purpose flour"],
  flyerItems: ingredients,
  genericIngredientsMarkdown: genericIngredients,
});

console.log(JSON.stringify(plan, null, 2));
