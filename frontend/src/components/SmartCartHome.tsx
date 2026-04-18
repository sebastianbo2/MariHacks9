import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PANTRY_ITEMS, PREP_MODES, type PrepMode } from "@/data/flyerData";

interface Props {
  onSubmit: (query: string, mode: PrepMode, pantry: string[]) => void;
}

export function SmartCartHome({ onSubmit }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<PrepMode>("tonight");
  const [pantry, setPantry] = useState<string[]>(["Salt", "Pepper", "Olive oil"]);
  const [pantryOpen, setPantryOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSubmit(query.trim(), mode, pantry);
  };

  const togglePantry = (item: string) => {
    setPantry((prev) => (prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient gradient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-sage/15 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-[24rem] w-[24rem] rounded-full bg-sage-soft blur-3xl" />
      </div>

      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 pt-8 sm:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-deep text-cream shadow-sm">
            <span className="font-display text-lg font-semibold">S</span>
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-semibold text-charcoal">SmartCart</p>
            <p className="text-xs text-muted-foreground">Montréal</p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur sm:inline-flex">
          <Sparkles className="h-3 w-3 text-sage" /> Beta
        </span>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col px-5 pb-20 pt-12 sm:px-8 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-3 text-sm font-medium tracking-wide text-sage-deep">
            Eat well. Spend less. This week.
          </p>
          <h1 className="text-balance font-display text-4xl font-semibold leading-[1.05] text-charcoal sm:text-6xl">
            What do you{" "}
            <span className="italic text-sage-deep">want to eat?</span>
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
            Tell us a craving. We'll cross-check Maxi, IGA, and Provigo flyers and
            build the cheapest realistic plan.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-10 space-y-6"
        >
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. comforting pasta, something with chicken, easy breakfasts…"
              className="h-16 rounded-2xl border-border bg-card pl-5 pr-14 text-base shadow-sm transition focus-visible:ring-sage sm:text-lg"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!query.trim()}
              className="absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 rounded-xl bg-sage-deep text-cream shadow-md transition hover:bg-sage-deep/90 disabled:opacity-40"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Segmented control */}
          <div className="rounded-2xl border border-border bg-card p-1.5 shadow-sm">
            <div className="grid grid-cols-3 gap-1">
              {PREP_MODES.map((m) => {
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMode(m.id)}
                    className="relative rounded-xl px-3 py-2.5 text-sm font-medium transition"
                  >
                    {active && (
                      <motion.span
                        layoutId="seg-active"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        className="absolute inset-0 rounded-xl bg-sage-deep shadow-sm"
                      />
                    )}
                    <span className={`relative z-10 ${active ? "text-cream" : "text-charcoal/70"}`}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pantry */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <button
              type="button"
              onClick={() => setPantryOpen((o) => !o)}
              className="flex w-full items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="text-sm font-semibold text-charcoal">What's already in your pantry?</p>
                <p className="text-xs text-muted-foreground">
                  {pantry.length} item{pantry.length === 1 ? "" : "s"} — we'll skip these.
                </p>
              </div>
              <motion.div animate={{ rotate: pantryOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </motion.div>
            </button>
            <motion.div
              initial={false}
              animate={{ height: pantryOpen ? "auto" : 0, opacity: pantryOpen ? 1 : 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-2 pb-2">
                <ScrollArea className="h-56">
                  <div className="grid grid-cols-2 gap-1 p-2 sm:grid-cols-3">
                    {PANTRY_ITEMS.map((item) => {
                      const checked = pantry.includes(item);
                      return (
                        <label
                          key={item}
                          className={`flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition ${
                            checked ? "bg-sage-soft text-sage-deep" : "hover:bg-muted"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => togglePantry(item)}
                            className="data-[state=checked]:border-sage-deep data-[state=checked]:bg-sage-deep"
                          />
                          <span className="font-medium">{item}</span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 text-center text-xs text-muted-foreground"
        >
          Prices reflect this week's flyers • Updated Monday mornings
        </motion.p>
      </main>
    </div>
  );
}
