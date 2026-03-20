import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import type { PathDef } from "@/lib/paths";
import { getRecommendedPaths } from "@/lib/paths";

const ECHO_PATH_POWERS: Record<string, { title: string; description: string }> = {
  chronos:   { title: "Rewind",    description: "Reverse time to retry your last wrong question." },
  syntax:    { title: "Hack",      description: "Hack the system to erase one wrong answer." },
  eloquence: { title: "Whisper",   description: "Hear a whisper revealing the explanation early." },
  treasury:  { title: "Jackpot",   description: "Double XP reward for this question." },
  vitality:  { title: "Heal",      description: "Restore one lost life." },
  fortitude: { title: "Shield",    description: "Block the next wrong answer from costing a life." },
  surge:     { title: "Overcharge", description: "Surge through — auto-answer correctly." },
  unity:     { title: "Bond",      description: "Narrow it down to just 2 options." },
  cosmos:    { title: "Vision",    description: "Briefly reveal the correct answer for 2 seconds." },
};

interface PathSelectionProps {
  interests: string[];
  onSelect: (pathId: string) => void;
}

const PathSelection = ({ interests, onSelect }: PathSelectionProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const paths = getRecommendedPaths(interests);

  const selectedPower = selected ? ECHO_PATH_POWERS[selected] : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 w-full max-w-lg"
      >
        <Mascot
          message="Choose the path that feels right. The story will reveal itself as you learn. ✨"
          size="sm"
          animation="celebrate"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-lg"
      >
        <h1 className="text-3xl font-semibold mb-2 text-foreground text-center">Choose Your Path</h1>
        <p className="text-muted-foreground mb-8 text-center">
          No spoilers — just trust your instinct.
        </p>

        <div className="space-y-4 mb-6">
          {paths.map((path, i) => (
            <motion.button
              key={path.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              onClick={() => setSelected(path.id)}
              className={`lesson-card w-full text-left relative overflow-hidden transition-all ${
                selected === path.id ? "border-primary shadow-lg ring-2 ring-primary/20" : ""
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/10" />

              <div className="relative flex items-center gap-4 p-3">
                <span className="text-4xl shrink-0">{path.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{path.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selected === path.id ? "Chosen path" : "Tap to choose"}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Show Echo of Path power when a path is selected */}
        <AnimatePresence>
          {selectedPower && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="lesson-card border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-primary text-sm">Echo of Path — {selectedPower.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{selectedPower.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-2">Use once per lesson as your special power.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className="w-full gap-2"
          size="lg"
        >
          Begin Journey <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </div>
  );
};

export default PathSelection;
