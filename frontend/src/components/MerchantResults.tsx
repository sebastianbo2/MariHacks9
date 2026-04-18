import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RecipeDialog } from "./RecipeDialog";
import { BackendResponse } from "@/App";
import {
  buildResults,
  merchantTotal,
  MERCHANT_META,
  type PricedRecipe,
  type Merchant,
  type PrepMode,
  type MerchantResult,
} from "@/data/flyerData";

interface Props {
  query: string;
  mode: PrepMode;
  loading: boolean;
  onBack: () => void;
  data: BackendResponse;
}

export function MerchantResults({ query, mode, loading, onBack }: Props) {
  const [activeRecipe, setActiveRecipe] = useState<PricedRecipe | null>(null);
  const [activeMerchant, setActiveMerchant] = useState<Merchant | null>(null);

  const results: MerchantResult[] = loading ? [] : buildResults(query, mode);
  const cheapest = results.length
    ? results.reduce((a, b) => (merchantTotal(a).total < merchantTotal(b).total ? a : b))
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

      <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
        {loading ? (
          <LoadingState />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-5"
          >
            {results.map((result) => (
              <MerchantCard
                key={result.merchant}
                result={result}
                isCheapest={cheapest?.merchant === result.merchant}
                onRecipeClick={(r) => {
                  setActiveRecipe(r);
                  setActiveMerchant(result.merchant);
                }}
              />
            ))}
          </motion.div>
        )}
      </main>

      <RecipeDialog
        recipe={activeRecipe}
        merchant={activeMerchant}
        open={!!activeRecipe}
        onOpenChange={(o) => !o && setActiveRecipe(null)}
      />
    </div>
  );
}

function MerchantCard({
  result,
  isCheapest,
  onRecipeClick,
}: {
  result: MerchantResult;
  isCheapest: boolean;
  onRecipeClick: (r: PricedRecipe) => void;
}) {
  const { total, savings } = merchantTotal(result);
  const hassle = +total.toFixed(2); // distance skipped for v1; Hassle = Cost

  return (
    <motion.section
      variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-base font-bold text-cream shadow-sm"
            style={{ backgroundColor: result.accent }}
          >
            {result.merchant[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-semibold text-charcoal">{result.merchant}</h2>
              {isCheapest && (
                <span className="inline-flex items-center gap-1 rounded-full bg-sage-deep px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                  <TrendingDown className="h-3 w-3" /> Best
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{MERCHANT_META[result.merchant].tag}</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Hassle score</p>
          <p className="font-mono text-2xl font-semibold text-charcoal">${hassle.toFixed(2)}</p>
          {savings > 0 && (
            <p className="font-mono text-[11px] text-sage-deep">save ${savings.toFixed(2)}</p>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-muted/30 px-5 py-4 sm:px-6">
        <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
          <div className="flex gap-3 pb-1">
            {result.recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe as PricedRecipe}
                accent={result.accent}
                onClick={() => onRecipeClick(recipe as PricedRecipe)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function RecipeCard({
  recipe,
  accent,
  onClick,
}: {
  recipe: PricedRecipe;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex w-56 shrink-0 flex-col rounded-xl border border-border bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-sage hover:shadow-md"
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
        style={{ backgroundColor: `color-mix(in oklch, ${accent} 12%, transparent)` }}
      >
        {recipe.emoji}
      </div>
      <p className="font-display text-base font-semibold leading-snug text-charcoal">{recipe.title}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{recipe.blurb}</p>
      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Serves {recipe.servings}
        </span>
        <span className="font-mono text-sm font-semibold text-charcoal">
          ${recipe.totalCost.toFixed(2)}
        </span>
      </div>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <div className="mt-5 flex gap-3">
            {[0, 1].map((j) => (
              <Skeleton key={j} className="h-40 w-56 shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
