import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SmartCartHome } from "@/components/SmartCartHome";
import { MerchantResults } from "@/components/MerchantResults";
import type { PrepMode } from "@/data/flyerData";
import AddressAutocomplete from "./components/AddressAutocomplete";

type Step = "home" | "address" | "results";

interface Coords {
  address: string;
  lat: number;
  lon: number;
}

interface Plan {
  query: string;
  mode: PrepMode;
  pantry: string[];
}

// Shared page transition variants
const pageVariants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

export default function App() {
  const [step, setStep] = useState<Step>("home");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (query: string, mode: PrepMode, pantry: string[]) => {
    setPlan({ query, mode, pantry });
    setStep("address");
  };

  const handleAddressSubmit = () => {
    if (!coords) return;
    setLoading(true);
    setStep("results");
    setTimeout(() => setLoading(false), 1400);
  };

  const handleBack = () => {
    setPlan(null);
    setCoords(null);
    setStep("home");
  };

  return (
    <AnimatePresence mode="wait">
      {step === "home" && (
        <motion.div
          key="home"
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
        >
          <SmartCartHome onSubmit={handleSubmit} />
        </motion.div>
      )}

      {step === "address" && (
        <motion.div
          key="address"
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
          className="min-h-screen bg-background"
        >
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-sage/15 blur-3xl" />
            <div className="absolute -bottom-32 -left-20 h-[24rem] w-[24rem] rounded-full bg-sage-soft blur-3xl" />
          </div>

          <header className="mx-auto flex max-w-5xl items-center px-5 pt-8 sm:px-8">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-deep text-cream shadow-sm">
                <span className="font-display text-lg font-semibold">S</span>
              </div>
              <div className="leading-tight">
                <p className="font-display text-base font-semibold text-charcoal">SmartCart</p>
                <p className="text-xs text-muted-foreground">Montréal</p>
              </div>
            </div>
          </header>

          <main className="mx-auto flex max-w-md flex-col items-center px-5 pt-24 sm:px-8 sm:pt-32">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center"
            >
              <p className="mb-3 text-sm font-medium tracking-wide text-sage-deep">
                Almost there.
              </p>
              <h1 className="mb-2 font-display text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
                Where are you{" "}
                <span className="italic text-sage-deep">shopping?</span>
              </h1>
              <p className="mb-10 text-sm text-muted-foreground">
                We'll find the best deals at stores closest to you.
              </p>

              <div className="flex flex-col items-center gap-4">
                <AddressAutocomplete
                  onSelect={(result) => setCoords(result)}
                  placeholder="Enter your address or postal code…"
                />

                <AnimatePresence>
                  {coords && (
                    <motion.p
                      key="coords-label"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-xs text-muted-foreground"
                    >
                      📍 {coords.address}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleAddressSubmit}
                  disabled={!coords}
                  whileTap={{ scale: 0.97 }}
                  className="mt-2 w-full max-w-[520px] rounded-2xl bg-sage-deep px-6 py-4 text-base font-semibold text-cream shadow-md transition hover:bg-sage-deep/90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Find deals →
                </motion.button>

                <button
                  onClick={() => setStep("home")}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}

      {step === "results" && plan && (
        <motion.div
          key="results"
          variants={pageVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={pageTransition}
        >
          <MerchantResults
            query={plan.query}
            mode={plan.mode}
            loading={loading}
            onBack={handleBack}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}