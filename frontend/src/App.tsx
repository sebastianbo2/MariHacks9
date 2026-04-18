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
  postcode: string | null;
}

interface Plan {
  query: string;
  mode: PrepMode;
  pantry: string[];
}

export interface Ingredient {
  price: number,
  name: String,
  quantity: number,
  usedQuantity: number,
}

export interface Recipe {
  title: String,
  store_name: String,
  store_lat: number,
  store_lon: number,
  ingredients: Array<Ingredient>,
  totalPrice: number,
  priceForRecipe: number,
  numberOfServings: number,
  description: String,
  prepMinutes: number,
  cookMinutes: number,
}

// 👇 Shape of whatever your backend sends back — adjust to match your API
export type BackendResponse = Recipe[];

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
  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (query: string, mode: PrepMode, pantry: string[]) => {
    setPlan({ query, mode, pantry });
    setStep("address");
  };

  const handleAddressSubmit = async () => {
    if (!coords || !plan) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: plan.query,
          mode: plan.mode,
          pantry: plan.pantry,
          lat: coords.lat,
          lon: coords.lon,
          address: coords.address,
          postcode: coords.postcode,
        }),
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data: BackendResponse = await response.json();
      setBackendData(data);
      setStep("results"); // only transition once data is ready
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPlan(null);
    setCoords(null);
    setBackendData(null);
    setError(null);
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

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="error"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-sm text-red-500"
                    >
                      {error} — please try again.
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.button
                  onClick={handleAddressSubmit}
                  disabled={!coords || loading}
                  whileTap={{ scale: 0.97 }}
                  className="relative mt-2 w-full max-w-[520px] rounded-2xl bg-sage-deep px-6 py-4 text-base font-semibold text-cream shadow-md transition hover:bg-sage-deep/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <motion.span
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Spinner /> Finding deals…
                      </motion.span>
                    ) : (
                      <motion.span
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        Find deals →
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                <button
                  onClick={() => setStep("home")}
                  disabled={loading}
                  className="text-xs text-muted-foreground underline-offset-2 hover:underline disabled:pointer-events-none disabled:opacity-40"
                >
                  ← Back
                </button>
              </div>
            </motion.div>
          </main>
        </motion.div>
      )}

      {step === "results" && plan && backendData && (
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
            loading={false}      // already done — no need for skeleton
            onBack={handleBack}
            data={backendData}   // 👈 your backend data lands here
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Small inline spinner so we don't need an extra import
function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}