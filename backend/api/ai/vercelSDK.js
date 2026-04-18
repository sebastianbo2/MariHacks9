import { ingredients, genericIngredients } from "./sampleData.js";
import { generateOptimizedMealPlan } from "./recipeEngine.js";

const plan = await generateOptimizedMealPlan({
  userRequest,
  pantryItems,
  flyerItems: ingredients,
  genericIngredientsMarkdown: genericIngredients,
});

console.log(JSON.stringify(plan, null, 2));
