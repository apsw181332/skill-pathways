import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GemCollectOverlayProps {
  amount: number;
  active: boolean;
  onDone: () => void;
}

const GemCollectOverlay = ({ amount, active, onDone }: GemCollectOverlayProps) => {
  const [phase, setPhase] = useState<"gems" | "done">("gems");
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) { setPhase("gems"); return; }
    const timer = setTimeout(() => {
      setPhase("done");
      setTimeout(() => onDoneRef.current(), 400);
    }, 1800);
    return () => clearTimeout(timer);
  }, [active]);

  if (!active) return null;

  // Generate gem particles
  const gems = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 200,
    y: (Math.random() - 0.5) * 200,
    delay: Math.random() * 0.3,
    size: 16 + Math.random() * 20,
    rotation: Math.random() * 360,
  }));

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center"
        >
          {/* Translucent backdrop */}
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />

          {/* Gem collection animation */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Scattered gems that converge to center */}
            {gems.map((gem) => (
              <motion.div
                key={gem.id}
                initial={{
                  x: gem.x * 2,
                  y: gem.y * 2,
                  opacity: 0,
                  scale: 0,
                  rotate: gem.rotation,
                }}
                animate={{
                  x: 0,
                  y: 0,
                  opacity: [0, 1, 1, 0.8],
                  scale: [0, 1.2, 1, 0.6],
                  rotate: 0,
                }}
                transition={{
                  duration: 1.2,
                  delay: gem.delay,
                  ease: "easeInOut",
                }}
                className="absolute"
                style={{ fontSize: gem.size }}
              >
                💎
              </motion.div>
            ))}

            {/* Central gem count */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring", bounce: 0.5 }}
              className="relative z-20 flex flex-col items-center"
            >
              <motion.div
                className="text-6xl mb-2"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 0.8, repeat: 2, delay: 0.8 }}
              >
                💎
              </motion.div>
              <motion.span
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, type: "spring" }}
                className="text-4xl font-bold text-primary"
              >
                +{amount}
              </motion.span>
              <motion.span
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="text-sm text-muted-foreground mt-1"
              >
                Gems Collected!
              </motion.span>
            </motion.div>

            {/* Sparkle ring */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.5, 2], opacity: [0, 0.6, 0] }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="absolute w-40 h-40 rounded-full border-2 border-primary/40"
            />
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.8, 2.5], opacity: [0, 0.4, 0] }}
              transition={{ duration: 1.5, delay: 0.7 }}
              className="absolute w-40 h-40 rounded-full border-2 border-accent/30"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GemCollectOverlay;
