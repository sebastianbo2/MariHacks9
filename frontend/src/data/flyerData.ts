export type Merchant = "Maxi" | "IGA" | "Provigo";
export type Category = "Produce" | "Dairy" | "Meat" | "Pantry" | "Bakery" | "Frozen";

export interface PriceItem {
  id: string;
  name: string;
  category: Category;
  unit: string;
  price: number;
  regularPrice?: number;
  onSale: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  blurb: string;
  servings: number;
  emoji: string;
  ingredientIds: { id: string; qty: string }[];
  steps: string[];
}

export interface MerchantResult {
  merchant: Merchant;
  accent: string;
  recipes: Recipe[];
}

export const MERCHANT_META: Record<Merchant, { tag: string; tone: string }> = {
  Maxi: { tag: "Lowest prices", tone: "oklch(0.62 0.19 30)" },
  IGA: { tag: "Local & fresh", tone: "oklch(0.55 0.14 145)" },
  Provigo: { tag: "Balanced value", tone: "oklch(0.5 0.13 250)" },
};

// Shared catalogue — same item id across merchants, different prices.
const PRICES: Record<Merchant, Record<string, PriceItem>> = {
  Maxi: {
    chicken_thigh: { id: "chicken_thigh", name: "Chicken thighs (boneless)", category: "Meat", unit: "1 kg", price: 8.99, regularPrice: 12.99, onSale: true },
    ground_beef: { id: "ground_beef", name: "Lean ground beef", category: "Meat", unit: "1 lb", price: 5.49, regularPrice: 6.99, onSale: true },
    carrots: { id: "carrots", name: "Carrots", category: "Produce", unit: "1 kg bag", price: 1.49, onSale: false },
    onion: { id: "onion", name: "Yellow onions", category: "Produce", unit: "3 lb", price: 2.99, onSale: false },
    garlic: { id: "garlic", name: "Garlic", category: "Produce", unit: "head", price: 0.79, onSale: false },
    bell_pepper: { id: "bell_pepper", name: "Bell pepper", category: "Produce", unit: "each", price: 1.29, regularPrice: 1.99, onSale: true },
    spinach: { id: "spinach", name: "Baby spinach", category: "Produce", unit: "312 g", price: 3.99, onSale: false },
    tomato: { id: "tomato", name: "Roma tomatoes", category: "Produce", unit: "1 lb", price: 1.99, onSale: false },
    rice: { id: "rice", name: "Long-grain rice", category: "Pantry", unit: "2 kg", price: 5.99, onSale: false },
    pasta: { id: "pasta", name: "Penne pasta", category: "Pantry", unit: "900 g", price: 1.97, regularPrice: 2.99, onSale: true },
    crushed_tomato: { id: "crushed_tomato", name: "Crushed tomatoes", category: "Pantry", unit: "796 ml", price: 1.49, onSale: false },
    parmesan: { id: "parmesan", name: "Parmesan", category: "Dairy", unit: "175 g", price: 5.99, onSale: false },
    yogurt: { id: "yogurt", name: "Greek yogurt", category: "Dairy", unit: "750 g", price: 4.99, regularPrice: 6.49, onSale: true },
    eggs: { id: "eggs", name: "Large eggs", category: "Dairy", unit: "dozen", price: 3.49, onSale: false },
    bread: { id: "bread", name: "Crusty baguette", category: "Bakery", unit: "each", price: 1.99, onSale: false },
  },
  IGA: {
    chicken_thigh: { id: "chicken_thigh", name: "Chicken thighs (boneless)", category: "Meat", unit: "1 kg", price: 11.99, onSale: false },
    ground_beef: { id: "ground_beef", name: "Lean ground beef", category: "Meat", unit: "1 lb", price: 6.49, onSale: false },
    carrots: { id: "carrots", name: "Carrots (organic)", category: "Produce", unit: "1 kg bag", price: 2.49, onSale: false },
    onion: { id: "onion", name: "Yellow onions", category: "Produce", unit: "3 lb", price: 3.49, onSale: false },
    garlic: { id: "garlic", name: "Garlic", category: "Produce", unit: "head", price: 0.99, onSale: false },
    bell_pepper: { id: "bell_pepper", name: "Bell pepper (local)", category: "Produce", unit: "each", price: 1.49, onSale: false },
    spinach: { id: "spinach", name: "Baby spinach", category: "Produce", unit: "312 g", price: 2.99, regularPrice: 4.49, onSale: true },
    tomato: { id: "tomato", name: "Vine tomatoes", category: "Produce", unit: "1 lb", price: 2.49, regularPrice: 3.49, onSale: true },
    rice: { id: "rice", name: "Basmati rice", category: "Pantry", unit: "2 kg", price: 7.99, onSale: false },
    pasta: { id: "pasta", name: "Penne pasta", category: "Pantry", unit: "900 g", price: 2.79, onSale: false },
    crushed_tomato: { id: "crushed_tomato", name: "Crushed tomatoes (San Marzano)", category: "Pantry", unit: "796 ml", price: 2.99, onSale: false },
    parmesan: { id: "parmesan", name: "Parmigiano Reggiano", category: "Dairy", unit: "175 g", price: 7.49, regularPrice: 9.99, onSale: true },
    yogurt: { id: "yogurt", name: "Greek yogurt (local)", category: "Dairy", unit: "750 g", price: 5.49, onSale: false },
    eggs: { id: "eggs", name: "Free-run eggs", category: "Dairy", unit: "dozen", price: 4.99, regularPrice: 5.99, onSale: true },
    bread: { id: "bread", name: "Sourdough boule", category: "Bakery", unit: "each", price: 4.49, onSale: false },
  },
  Provigo: {
    chicken_thigh: { id: "chicken_thigh", name: "Chicken thighs (boneless)", category: "Meat", unit: "1 kg", price: 9.99, regularPrice: 11.99, onSale: true },
    ground_beef: { id: "ground_beef", name: "Lean ground beef", category: "Meat", unit: "1 lb", price: 5.99, onSale: false },
    carrots: { id: "carrots", name: "Carrots", category: "Produce", unit: "1 kg bag", price: 1.79, onSale: false },
    onion: { id: "onion", name: "Yellow onions", category: "Produce", unit: "3 lb", price: 2.79, regularPrice: 3.49, onSale: true },
    garlic: { id: "garlic", name: "Garlic", category: "Produce", unit: "head", price: 0.89, onSale: false },
    bell_pepper: { id: "bell_pepper", name: "Bell pepper", category: "Produce", unit: "each", price: 1.49, onSale: false },
    spinach: { id: "spinach", name: "Baby spinach", category: "Produce", unit: "312 g", price: 3.49, onSale: false },
    tomato: { id: "tomato", name: "Roma tomatoes", category: "Produce", unit: "1 lb", price: 1.79, regularPrice: 2.49, onSale: true },
    rice: { id: "rice", name: "Long-grain rice", category: "Pantry", unit: "2 kg", price: 6.49, onSale: false },
    pasta: { id: "pasta", name: "Penne pasta (PC)", category: "Pantry", unit: "900 g", price: 2.29, onSale: false },
    crushed_tomato: { id: "crushed_tomato", name: "Crushed tomatoes", category: "Pantry", unit: "796 ml", price: 1.79, onSale: false },
    parmesan: { id: "parmesan", name: "Parmesan", category: "Dairy", unit: "175 g", price: 6.49, onSale: false },
    yogurt: { id: "yogurt", name: "Greek yogurt", category: "Dairy", unit: "750 g", price: 4.49, regularPrice: 5.99, onSale: true },
    eggs: { id: "eggs", name: "Large eggs", category: "Dairy", unit: "dozen", price: 3.79, onSale: false },
    bread: { id: "bread", name: "French baguette", category: "Bakery", unit: "each", price: 2.49, onSale: false },
  },
};

const RECIPE_TEMPLATES: Recipe[] = [
  {
    id: "weeknight_chicken",
    title: "Weeknight roasted chicken & veg",
    blurb: "One-pan thighs, golden carrots, garlic spinach.",
    servings: 2,
    emoji: "🍗",
    ingredientIds: [
      { id: "chicken_thigh", qty: "0.5 kg" },
      { id: "carrots", qty: "½ bag" },
      { id: "garlic", qty: "1 head" },
      { id: "spinach", qty: "1 pack" },
    ],
    steps: [
      "Heat oven to 220°C. Toss carrots with oil, salt, and smashed garlic on a sheet pan.",
      "Pat chicken dry, season generously, and nestle on top of the carrots.",
      "Roast 25 minutes until skin is crisp and carrots caramelize.",
      "Wilt spinach in the pan drippings for 60 seconds off heat.",
      "Plate everything together — finish with cracked pepper and lemon.",
    ],
  },
  {
    id: "pantry_pasta",
    title: "Garlicky tomato penne",
    blurb: "15-minute pantry pasta with a little parmesan magic.",
    servings: 2,
    emoji: "🍝",
    ingredientIds: [
      { id: "pasta", qty: "½ box" },
      { id: "crushed_tomato", qty: "1 can" },
      { id: "garlic", qty: "4 cloves" },
      { id: "parmesan", qty: "to finish" },
    ],
    steps: [
      "Boil pasta in well-salted water until just shy of al dente.",
      "Sizzle sliced garlic in olive oil until pale gold.",
      "Add crushed tomatoes, simmer 6 minutes, season to taste.",
      "Toss pasta in the sauce with a splash of pasta water.",
      "Shower with parmesan and torn basil if you have it.",
    ],
  },
  {
    id: "beef_skillet",
    title: "Skillet beef & pepper rice",
    blurb: "Sweet peppers, jammy onions, sizzled ground beef over rice.",
    servings: 2,
    emoji: "🥘",
    ingredientIds: [
      { id: "ground_beef", qty: "1 lb" },
      { id: "bell_pepper", qty: "2" },
      { id: "onion", qty: "1" },
      { id: "rice", qty: "1.5 cups" },
    ],
    steps: [
      "Start the rice — 1.5 cups rice to 2.5 cups water, lid on, low heat.",
      "Brown the beef hard in a hot skillet, breaking it up. Drain excess fat.",
      "Add sliced onion and peppers, cook until softened and lightly charred.",
      "Splash in soy sauce or Worcestershire and toss to glaze.",
      "Pile over rice with a fried egg on top if you're feeling it.",
    ],
  },
  {
    id: "yogurt_breakfast",
    title: "3-day breakfast jars",
    blurb: "Greek yogurt, jammy tomato eggs, toast — set it and forget it.",
    servings: 3,
    emoji: "🥣",
    ingredientIds: [
      { id: "yogurt", qty: "1 tub" },
      { id: "eggs", qty: "6" },
      { id: "tomato", qty: "½ lb" },
      { id: "bread", qty: "1 loaf" },
    ],
    steps: [
      "Hard-boil 6 eggs, cool in ice water, peel and refrigerate.",
      "Quick-roast tomatoes with olive oil at 200°C for 15 min until jammy.",
      "Layer yogurt + roasted tomato + a drizzle of honey in three jars.",
      "Slice baguette into thick toast-ready pieces.",
      "Each morning: toast bread, halve an egg, eat with a yogurt jar.",
    ],
  },
];

export const PANTRY_ITEMS = [
  "Salt", "Pepper", "Olive oil", "Butter", "Flour", "Sugar",
  "Soy sauce", "Vinegar", "Honey", "Lemon", "Dried herbs", "Stock cubes",
];

export type PrepMode = "tonight" | "three-day" | "week";

export const PREP_MODES: { id: PrepMode; label: string; recipeCount: number }[] = [
  { id: "tonight", label: "Just Tonight", recipeCount: 1 },
  { id: "three-day", label: "3-Day Prep", recipeCount: 2 },
  { id: "week", label: "Full Week", recipeCount: 3 },
];

export interface PricedIngredient {
  item: PriceItem;
  qty: string;
  lineCost: number;
}

export interface PricedRecipe extends Recipe {
  ingredients: PricedIngredient[];
  totalCost: number;
  estimatedSavings: number;
}

// Deterministic "calculatePrice tool" stand-in.
export function priceRecipe(merchant: Merchant, recipe: Recipe): PricedRecipe {
  const ingredients: PricedIngredient[] = recipe.ingredientIds.map((ing) => {
    const item = PRICES[merchant][ing.id];
    // Approximate line cost — qty parsing kept simple for v1
    const factor = parseQtyFactor(ing.qty);
    const lineCost = +(item.price * factor).toFixed(2);
    return { item, qty: ing.qty, lineCost };
  });

  const totalCost = +ingredients.reduce((s, i) => s + i.lineCost, 0).toFixed(2);
  const estimatedSavings = +ingredients.reduce((s, i) => {
    if (i.item.onSale && i.item.regularPrice) {
      const factor = parseQtyFactor(i.qty);
      return s + (i.item.regularPrice - i.item.price) * factor;
    }
    return s;
  }, 0).toFixed(2);

  return { ...recipe, ingredients, totalCost, estimatedSavings };
}

function parseQtyFactor(qty: string): number {
  const lower = qty.toLowerCase();
  if (lower.includes("½")) return 0.5;
  if (lower.includes("¼")) return 0.25;
  if (lower.includes("to finish")) return 0.3;
  const num = parseFloat(lower);
  if (isNaN(num)) return 1;
  if (lower.includes("kg") && lower.includes("0.5")) return 0.5;
  return Math.min(num, 4);
}

export function buildResults(_query: string, mode: PrepMode): MerchantResult[] {
  const count = PREP_MODES.find((m) => m.id === mode)!.recipeCount;
  const merchants: Merchant[] = ["Maxi", "IGA", "Provigo"];
  return merchants.map((merchant) => ({
    merchant,
    accent: MERCHANT_META[merchant].tone,
    recipes: RECIPE_TEMPLATES.slice(0, count + 1).map((r) => priceRecipe(merchant, r)),
  }));
}

export function merchantTotal(result: MerchantResult): { total: number; savings: number } {
  const total = result.recipes.reduce((s, r) => s + (r as PricedRecipe).totalCost, 0);
  const savings = result.recipes.reduce((s, r) => s + (r as PricedRecipe).estimatedSavings, 0);
  return { total: +total.toFixed(2), savings: +savings.toFixed(2) };
}
