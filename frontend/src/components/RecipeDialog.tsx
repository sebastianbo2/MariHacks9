import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type PricedRecipe, type Merchant, type Category } from "@/data/flyerData";

interface Props {
  recipe: PricedRecipe | null;
  merchant: Merchant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_ORDER: Category[] = ["Produce", "Meat", "Dairy", "Pantry", "Bakery", "Frozen"];

export function RecipeDialog({ recipe, merchant, open, onOpenChange }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (!recipe || !merchant) return null;

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: recipe.ingredients.filter((i) => i.item.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden rounded-2xl p-0">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-sage-soft via-cream to-sage-soft px-6 pb-5 pt-7">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card text-3xl shadow-sm">
              {recipe.emoji}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-wider text-sage-deep">
                At {merchant} • Serves {recipe.servings}
              </p>
              <DialogHeader>
                <DialogTitle className="mt-1 font-display text-2xl font-semibold leading-tight text-charcoal">
                  {recipe.title}
                </DialogTitle>
              </DialogHeader>
              <p className="mt-1.5 text-sm text-muted-foreground">{recipe.blurb}</p>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-7 px-6 pb-6 pt-6">
            {/* Shopping list */}
            <section>
              <h3 className="mb-3 font-display text-base font-semibold text-charcoal">Shopping list</h3>
              <div className="space-y-4">
                {grouped.map((group) => (
                  <div key={group.category}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.category}
                    </p>
                    <div className="overflow-hidden rounded-xl border border-border">
                      {group.items.map((ing, idx) => {
                        const id = ing.item.id;
                        const isChecked = checked.has(id);
                        return (
                          <label
                            key={id}
                            className={`flex cursor-pointer items-center gap-3 px-3.5 py-3 transition ${
                              idx > 0 ? "border-t border-border" : ""
                            } ${isChecked ? "bg-sage-soft/50" : "hover:bg-muted/50"}`}
                          >
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() => toggle(id)}
                              className="data-[state=checked]:border-sage-deep data-[state=checked]:bg-sage-deep"
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium ${
                                  isChecked ? "text-muted-foreground line-through" : "text-charcoal"
                                }`}
                              >
                                {ing.item.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {ing.qty} • {ing.item.unit}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {ing.item.onSale && (
                                <Badge className="border-0 bg-sale/10 text-[10px] font-semibold uppercase tracking-wide text-sale hover:bg-sale/10">
                                  Sale
                                </Badge>
                              )}
                              <div className="text-right">
                                <p className="font-mono text-sm font-semibold text-charcoal">
                                  ${ing.lineCost.toFixed(2)}
                                </p>
                                {ing.item.onSale && ing.item.regularPrice && (
                                  <p className="font-mono text-[10px] text-muted-foreground line-through">
                                    ${ing.item.regularPrice.toFixed(2)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Instructions */}
            <section>
              <h3 className="mb-3 font-display text-base font-semibold text-charcoal">Instructions</h3>
              <ol className="space-y-2.5">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage-soft font-mono text-xs font-semibold text-sage-deep">
                      {i + 1}
                    </span>
                    <p className="pt-0.5 text-sm leading-relaxed text-charcoal/85">{step}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Economics */}
            <section>
              <h3 className="mb-3 font-display text-base font-semibold text-charcoal">Economics</h3>
              <div className="rounded-2xl bg-charcoal p-5 text-cream">
                <div className="flex items-baseline justify-between">
                  <p className="text-xs uppercase tracking-wider text-cream/60">Total cost</p>
                  <p className="font-display text-3xl font-semibold">${recipe.totalCost.toFixed(2)}</p>
                </div>
                <div className="my-4 h-px bg-cream/10" />
                <div className="flex items-baseline justify-between">
                  <p className="text-xs uppercase tracking-wider text-cream/60">Estimated savings</p>
                  <p className="font-mono text-lg font-semibold text-sage-soft">
                    {recipe.estimatedSavings > 0 ? `−$${recipe.estimatedSavings.toFixed(2)}` : "—"}
                  </p>
                </div>
                <p className="mt-3 text-xs text-cream/50">
                  vs regular flyer prices. Per-serving:{" "}
                  <span className="font-mono">
                    ${(recipe.totalCost / recipe.servings).toFixed(2)}
                  </span>
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
