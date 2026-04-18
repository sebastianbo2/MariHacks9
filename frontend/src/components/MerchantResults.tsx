import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Clock, Users, MapPin, X,
  ShoppingBag, ChefHat, TrendingDown,
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PrepMode } from "@/data/flyerData";
import { BackendResponse, Recipe } from "@/App";

interface Props {
  query: string;
  mode: PrepMode;
  loading: boolean;
  onBack: () => void;
  data: BackendResponse;
  userLat?: number;
  userLon?: number;
}

type SortKey = "totalPrice" | "recipePrice" | "distance";
type SortDir = "asc" | "desc";

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------
function toRadians(deg: number) {
  return deg * (Math.PI / 180);
}

function calculateDistance(
  userLat: number,
  userLon: number,
  storeLat: number,
  storeLon: number
): number {
  if (!storeLat || !storeLon || !userLat || !userLon) return Infinity;
  const R = 6371;
  const dLat = toRadians(storeLat - userLat);
  const dLon = toRadians(storeLon - userLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(userLat)) *
      Math.cos(toRadians(storeLat)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km === Infinity) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// ---------------------------------------------------------------------------
// Strip internal prefixes injected by the backend engine so they never
// leak into the UI. e.g. "GENERIC: Olive Oil" → "Olive Oil",
// "PANTRY: Salt" → "Salt", "CLIQUEZ ICI…" → ingredient.name fallback.
// ---------------------------------------------------------------------------
function cleanSourceName(sourceItemName: string, fallback: string): string {
  if (!sourceItemName) return fallback;
  // Strip known prefixes
  const stripped = sourceItemName
    .replace(/^(GENERIC|PANTRY|SALE):\s*/i, "")
    .trim();
  // If what remains looks like a French call-to-action / URL / junk, use fallback
  if (
    !stripped ||
    /cliquez/i.test(stripped) ||
    /^https?:\/\//i.test(stripped) ||
    stripped.length < 2
  ) {
    return fallback;
  }
  return stripped;
}

// ---------------------------------------------------------------------------
// Nominatim reverse geocode → full civic address string.
// We pass this to Google Maps so it resolves the exact store listing
// rather than doing a broad chain-wide search.
// ---------------------------------------------------------------------------
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { "Accept-Language": "en", "User-Agent": "SmartCart/1.0" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.display_name ?? null;
  } catch {
    return null;
  }
}

function googleMapsUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function openMaps(query: string) {
  window.open(googleMapsUrl(query), "_blank", "noopener,noreferrer");
}

// ---------------------------------------------------------------------------
// Hook: resolve full addresses for all stores via Nominatim (staggered at
// 1.1 s intervals to respect their 1 req/sec rate limit).
// ---------------------------------------------------------------------------
function useStoreAddresses(recipes: Recipe[]): Map<string, string> {
  const [addresses, setAddresses] = useState<Map<string, string>>(new Map());
  const resolvedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!recipes.length) return;

    const unique = Array.from(
      new Map(
        recipes
          .filter((r) => r.store_lat && r.store_lon)
          .map((r) => [`${r.store_lat},${r.store_lon}`, r])
      ).values()
    );

    unique.forEach((recipe, i) => {
      const key = `${recipe.store_lat},${recipe.store_lon}`;
      if (resolvedRef.current.has(key)) return;
      resolvedRef.current.add(key);

      setTimeout(async () => {
        const address = await reverseGeocode(recipe.store_lat, recipe.store_lon);
        if (address) {
          setAddresses((prev) => {
            const next = new Map(prev);
            // Prepend the store name so Maps shows it prominently
            next.set(key, `${recipe.store_name}, ${address}`);
            return next;
          });
        }
      }, i * 1100);
    });
  }, [recipes]);

  return addresses;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function MerchantResults({
  query,
  mode,
  loading,
  onBack,
  data,
  userLat = 0,
  userLon = 0,
}: Props) {
  const recipes = data as Recipe[];
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("recipePrice");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const storeAddresses = useStoreAddresses(recipes);

  const cheapestPrice = recipes.length
    ? Math.min(...recipes.map((r) => r.priceForRecipe))
    : null;

  const sortedRecipes = useMemo(() => {
    return [...recipes].sort((a, b) => {
      let valA: number;
      let valB: number;
      if (sortKey === "totalPrice") {
        valA = a.totalPrice;
        valB = b.totalPrice;
      } else if (sortKey === "recipePrice") {
        valA = a.priceForRecipe;
        valB = b.priceForRecipe;
      } else {
        valA = calculateDistance(userLat, userLon, a.store_lat, a.store_lon);
        valB = calculateDistance(userLat, userLon, b.store_lat, b.store_lon);
      }
      return sortDir === "asc" ? valA - valB : valB - valA;
    });
  }, [recipes, sortKey, sortDir, userLat, userLon]);

  const handleSortKey = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const modeLabel =
    mode === "tonight"
      ? "Just tonight"
      : mode === "three-day"
      ? "3-day prep"
      : "Full week";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 shrink-0 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Plan for
            </p>
            <p className="truncate font-display text-base font-semibold text-charcoal">
              "{query}"
            </p>
          </div>
          <span className="hidden rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-sage-deep sm:inline">
            {modeLabel}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        {loading ? (
          <LoadingState />
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-semibold text-charcoal">No recipes found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search or location.
            </p>
          </div>
        ) : (
          <>
            {/* Sort controls */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Sort by</span>
              {(["recipePrice", "totalPrice", "distance"] as SortKey[]).map((key) => {
                const labels: Record<SortKey, string> = {
                  recipePrice: "Recipe cost",
                  totalPrice: "Grocery total",
                  distance: "Distance",
                };
                const active = sortKey === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleSortKey(key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "border-sage-deep bg-sage-deep text-cream"
                        : "border-border bg-card text-charcoal hover:border-sage hover:bg-muted"
                    }`}
                  >
                    {labels[key]}
                    {active ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                );
              })}
              <button
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-charcoal transition hover:border-sage hover:bg-muted"
              >
                {sortDir === "asc" ? (
                  <><ArrowUp className="h-3 w-3" /> Low → High</>
                ) : (
                  <><ArrowDown className="h-3 w-3" /> High → Low</>
                )}
              </button>
            </div>

            <motion.div
              initial="hidden"
              animate="show"
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
              className="space-y-4"
            >
              {sortedRecipes.map((recipe, i) => (
                <RecipeCard
                  key={`${recipe.title}-${i}`}
                  recipe={recipe}
                  isCheapest={recipe.priceForRecipe === cheapestPrice}
                  onClick={() => setActiveRecipe(recipe)}
                  userLat={userLat}
                  userLon={userLon}
                  resolvedAddress={storeAddresses.get(`${recipe.store_lat},${recipe.store_lon}`)}
                />
              ))}
            </motion.div>
          </>
        )}
      </main>

      <RecipeModal
        recipe={activeRecipe}
        isCheapest={activeRecipe?.priceForRecipe === cheapestPrice}
        onClose={() => setActiveRecipe(null)}
        userLat={userLat}
        userLon={userLon}
        resolvedAddress={
          activeRecipe
            ? storeAddresses.get(`${activeRecipe.store_lat},${activeRecipe.store_lon}`)
            : undefined
        }
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recipe card
// ---------------------------------------------------------------------------
function RecipeCard({
  recipe,
  isCheapest,
  onClick,
  userLat,
  userLon,
  resolvedAddress,
}: {
  recipe: Recipe;
  isCheapest: boolean;
  onClick: () => void;
  userLat: number;
  userLon: number;
  resolvedAddress?: string;
}) {
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;
  const distance = calculateDistance(userLat, userLon, recipe.store_lat, recipe.store_lon);
  const mapsQuery = resolvedAddress ?? (recipe.store_name as string);

  // priceForRecipe = your portion cost (always ≤ totalPrice)
  // totalPrice     = full grocery basket cost
  const savings = recipe.totalPrice - recipe.priceForRecipe;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <button
        onClick={onClick}
        className="flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-muted/30 sm:px-6"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-charcoal">{recipe.title}</h2>
            {isCheapest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage-deep px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                <TrendingDown className="h-2.5 w-2.5" /> Best value
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalMinutes} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.numberOfServings} serving{recipe.numberOfServings !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); openMaps(mapsQuery); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); openMaps(mapsQuery); }
                }}
                className="cursor-pointer underline underline-offset-2 hover:text-sage-deep transition-colors"
              >
                {recipe.store_name}
              </span>
              {distance !== Infinity && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-charcoal">
                  {formatDistance(distance)}
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Pricing — recipe cost is the primary number, grocery total is secondary */}
        <div className="shrink-0 text-right">
          <p className="font-mono text-xl font-semibold text-charcoal">
            ${recipe.priceForRecipe.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground">recipe cost</p>
          {savings > 0.01 && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              ${recipe.totalPrice.toFixed(2)} groceries
            </p>
          )}
        </div>
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Recipe modal
// ---------------------------------------------------------------------------
function RecipeModal({
  recipe,
  isCheapest,
  onClose,
  userLat,
  userLon,
  resolvedAddress,
}: {
  recipe: Recipe | null;
  isCheapest: boolean;
  onClose: () => void;
  userLat: number;
  userLon: number;
  resolvedAddress?: string;
}) {
  const totalMinutes = recipe ? recipe.prepMinutes + recipe.cookMinutes : 0;
  const distance = recipe
    ? calculateDistance(userLat, userLon, recipe.store_lat, recipe.store_lon)
    : Infinity;
<<<<<<< Updated upstream

  useEffect(() => {
    if (!recipe) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [recipe]);

=======
>>>>>>> Stashed changes
  const mapsQuery = resolvedAddress ?? (recipe?.store_name as string) ?? "";

  // Safely pull extended fields that the backend sends but the TS type may not declare
  const buyItems: Array<{ name: string; quantity: number; unit: string; price: number }> =
    (recipe as any)?.buyItems ?? [];
  const instructions: string[] = (recipe as any)?.instructions ?? [];
  const savings = recipe ? recipe.totalPrice - recipe.priceForRecipe : 0;

  return (
    <AnimatePresence>
      {recipe && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-50 max-h-[85vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="border-b border-border px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold text-charcoal">
                      {recipe.title}
                    </h2>
                    {isCheapest && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sage-deep px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                        <TrendingDown className="h-2.5 w-2.5" /> Best value
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{recipe.description}</p>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-charcoal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Meta pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-charcoal">
                  <Clock className="h-3.5 w-3.5 text-sage-deep" />
                  {recipe.prepMinutes}m prep · {recipe.cookMinutes}m cook · {totalMinutes}m total
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-charcoal">
                  <Users className="h-3.5 w-3.5 text-sage-deep" />
                  {recipe.numberOfServings} serving{recipe.numberOfServings !== 1 ? "s" : ""}
                </span>
                <a
                  href={googleMapsUrl(mapsQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-charcoal transition hover:bg-sage-soft hover:text-sage-deep"
                >
                  <MapPin className="h-3.5 w-3.5 text-sage-deep" />
                  {recipe.store_name}
                  {distance !== Infinity && (
                    <span className="font-semibold text-sage-deep">
                      · {formatDistance(distance)}
                    </span>
                  )}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="overflow-y-auto" style={{ maxHeight: "calc(85vh - 190px)" }}>

              {/* What to buy */}
              {buyItems.length > 0 && (
                <div className="px-6 py-5">
                  <div className="mb-3 flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-sage-deep" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-sage-deep">
                      What to buy
                    </p>
                  </div>
                  <ul className="space-y-2.5">
                    {buyItems.map((item, i) => (
                      <li key={i} className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-charcoal">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity} {item.unit}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-semibold text-charcoal">
                          ${item.price.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {buyItems.length > 0 && <div className="mx-6 border-t border-border" />}

              {/* Ingredients used */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center gap-1.5">
                  <ChefHat className="h-4 w-4 text-sage-deep" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-sage-deep">
                    Ingredients
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ing, i) => {
                    const displaySource = cleanSourceName(
                      (ing as any).sourceItemName ?? "",
                      ing.name as string
                    );
                    const isFromStore =
                      displaySource.toLowerCase() !== (ing.name as string).toLowerCase();

                    return (
                      <li key={i} className="flex items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-charcoal">
                            {ing.usedQuantity} {(ing as any).unit ?? ""} {ing.name}
                          </p>
                          {isFromStore && (
                            <p className="truncate text-xs text-muted-foreground">
                              from {displaySource}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-xs font-semibold text-charcoal">
                          ${ing.price.toFixed(2)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mx-6 border-t border-border" />

              {/* Instructions */}
              {instructions.length > 0 && (
                <>
                  <div className="px-6 py-5">
                    <div className="mb-3 flex items-center gap-1.5">
                      <ChefHat className="h-4 w-4 text-sage-deep" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-sage-deep">
                        Instructions
                      </p>
                    </div>
                    <ol className="space-y-3">
                      {instructions.map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-soft text-[11px] font-semibold text-sage-deep">
                            {i + 1}
                          </span>
                          <p className="text-sm leading-relaxed text-charcoal/90">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div className="mx-6 border-t border-border" />
                </>
              )}

              {/* Cost breakdown */}
              <div className="px-6 py-5">
                <div className="mb-3 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-sage-deep" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-sage-deep">
                    Cost breakdown
                  </p>
                </div>
                <div className="space-y-2">
                  {/* Recipe cost — always ≤ grocery total */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-charcoal font-medium">Recipe cost</p>
                      <p className="text-xs text-muted-foreground">
                        your portion for {recipe.numberOfServings} serving
                        {recipe.numberOfServings !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-semibold text-charcoal">
                      ${recipe.priceForRecipe.toFixed(2)}
                    </span>
                  </div>

                  {/* Grocery total — what you actually pay at the register */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Grocery total</p>
                      <p className="text-xs text-muted-foreground">full items at the register</p>
                    </div>
                    <span className="font-mono text-sm text-muted-foreground">
                      ${recipe.totalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Leftovers savings callout */}
                  {savings > 0.01 && (
                    <div className="flex items-center justify-between rounded-xl bg-sage-soft px-3 py-2">
                      <div>
                        <p className="text-xs font-medium text-sage-deep">Leftovers value</p>
                        <p className="text-[10px] text-sage-deep/70">
                          ingredients you keep after cooking
                        </p>
                      </div>
                      <span className="font-mono text-xs font-semibold text-sage-deep">
                        ${savings.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-3 pt-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-16 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}