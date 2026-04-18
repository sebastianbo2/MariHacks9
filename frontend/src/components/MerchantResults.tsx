import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Users, ChevronDown, ShoppingBag, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PrepMode } from "@/data/flyerData";
import type { BackendResponse, Recipe, Ingredient } from "@/App";

interface Props {
  query: string;
  mode: PrepMode;
  loading: boolean;
  onBack: () => void;
  data: BackendResponse;
}

export function MerchantResults({ query, mode, loading, onBack, data }: Props) {
  const recipes = data as Recipe[];

  const cheapestPrice = recipes.length
    ? Math.min(...recipes.map((r) => r.priceForRecipe))
    : null;

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
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan for</p>
            <p className="truncate font-display text-base font-semibold text-charcoal">"{query}"</p>
          </div>
          <span className="hidden rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-sage-deep sm:inline">
            {mode === "tonight" ? "Just tonight" : mode === "three-day" ? "3-day prep" : "Full week"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        {loading ? (
          <LoadingState />
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-semibold text-charcoal">No recipes found</p>
            <p className="mt-1 text-sm text-muted-foreground">Try a different search or location.</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
            className="space-y-4"
          >
            {recipes.map((recipe, i) => (
              <RecipeCard
                key={`${recipe.title}-${i}`}
                recipe={recipe}
                isCheapest={recipe.priceForRecipe === cheapestPrice}
              />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function RecipeCard({ recipe, isCheapest }: { recipe: Recipe; isCheapest: boolean }) {
  const [open, setOpen] = useState(false);
  const totalMinutes = recipe.prepMinutes + recipe.cookMinutes;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      {/* Main row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-4 px-5 py-5 text-left transition hover:bg-muted/30 sm:px-6"
      >
        {/* Left: title + meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-charcoal">{recipe.title}</h2>
            {isCheapest && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage-deep px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                Best value
              </span>
            )}
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {totalMinutes} min
              {recipe.prepMinutes > 0 && recipe.cookMinutes > 0 && (
                <span className="text-muted-foreground/60">
                  ({recipe.prepMinutes}p + {recipe.cookMinutes}c)
                </span>
              )}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {recipe.numberOfServings} serving{recipe.numberOfServings !== 1 ? "s" : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {recipe.store_name}
            </span>
          </div>
        </div>

        {/* Right: price + chevron */}
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <p className="font-mono text-xl font-semibold text-charcoal">
              ${recipe.priceForRecipe.toFixed(2)}
            </p>
            {recipe.totalPrice !== recipe.priceForRecipe && (
              <p className="text-[11px] text-muted-foreground">
                ${recipe.totalPrice.toFixed(2)} groceries
              </p>
            )}
          </div>
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </div>
      </button>

      {/* Expandable ingredients */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ingredients"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
              <div className="mb-3 flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-sage-deep" />
                <p className="text-xs font-semibold uppercase tracking-wide text-sage-deep">
                  Ingredients
                </p>
              </div>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-center justify-between gap-4">
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-sm font-medium text-charcoal truncate">{ing.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        × {ing.usedQuantity}
                        {ing.usedQuantity !== ing.quantity && (
                          <span className="text-muted-foreground/60"> of {ing.quantity}</span>
                        )}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-medium text-charcoal shrink-0">
                      ${ing.price.toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Total row */}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">Recipe cost</span>
                <span className="font-mono text-sm font-semibold text-charcoal">
                  ${recipe.priceForRecipe.toFixed(2)}
                </span>
              </div>
              {recipe.totalPrice !== recipe.priceForRecipe && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">Total groceries</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    ${recipe.totalPrice.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

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