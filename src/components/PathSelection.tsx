import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import type { PathDef } from "@/lib/paths";
import { getRecommendedPaths } from "@/lib/paths";

interface PathSelectionProps {
  interests: string[];
  onSelect: (pathId: string) => void;
}

const PathSelection = ({ interests, onSelect }: PathSelectionProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const paths = getRecommendedPaths(interests);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 w-full max-w-lg"
      >
        <Mascot
          message="Choose your path, adventurer! Each path gives you unique visual effects as you learn. 🌟"
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
          Your path adds a story element to your learning journey with unique visual effects.
        </p>

        <div className="space-y-4 mb-8">
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
              {/* Subtle gradient background */}
              <div className={`absolute inset-0 opacity-5 bg-gradient-to-r ${
                path.id === "syntax" ? "from-emerald-500 to-cyan-500" :
                path.id === "eloquence" ? "from-violet-500 to-purple-500" :
                path.id === "treasury" ? "from-amber-500 to-yellow-500" :
                path.id === "vitality" ? "from-green-500 to-emerald-500" :
                path.id === "chronos" ? "from-sky-500 to-blue-500" :
                path.id === "fortitude" ? "from-slate-500 to-zinc-500" :
                path.id === "surge" ? "from-yellow-500 to-orange-500" :
                path.id === "unity" ? "from-pink-500 to-rose-500" :
                "from-indigo-500 to-violet-500"
              }`} />
              
              <div className="relative flex items-start gap-4 p-1">
                <span className="text-4xl shrink-0">{path.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">{path.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{path.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>Correct: {path.correctEmoji} flash</span>
                    <span>•</span>
                    <span>Finish: {path.endLessonDescription.slice(0, 40)}…</span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

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
