import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SmartCartHome } from "@/components/SmartCartHome";
import { MerchantResults } from "@/components/MerchantResults";
import type { PrepMode } from "@/data/flyerData";
import AddressInput from "./components/AddressInput";

interface Plan {
  query: string;
  mode: PrepMode;
  pantry: string[];
}

export default function App() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (query: string, mode: PrepMode, pantry: string[]) => {
    setPlan({ query, mode, pantry });
    setLoading(true);
    // Simulate AI streaming
    setTimeout(() => setLoading(false), 1400);
  };

  const handleBack = () => setPlan(null);

  return (
    <AnimatePresence mode="wait">
      {!plan ? (
        <motion.div
          key="home"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          <SmartCartHome onSubmit={handleSubmit} />
          <AddressInput></AddressInput>
        </motion.div>
      ) : (
        <motion.div
          key="results"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
