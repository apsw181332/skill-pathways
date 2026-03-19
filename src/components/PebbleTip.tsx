import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import mascotImg from "@/assets/mascot-penguin.png";

interface PebbleTipProps {
  learningCode?: string | null;
  stepType: "info" | "quiz" | "drag";
  question?: string;
  recentAccuracy: number;
  options?: string[];
  correctIndex?: number;
  content?: string;
}

// Positions Pebble can pop out from
const POSITIONS = [
  "fixed right-4 bottom-24",
  "fixed right-4 bottom-40",
  "fixed left-4 bottom-24",
  "fixed left-4 bottom-40",
  "fixed right-4 top-32",
  "fixed left-4 top-32",
];

function generateTip({ learningCode, stepType, recentAccuracy, question, options, correctIndex, content }: PebbleTipProps): string {
  const tips: string[] = [];

  if (stepType === "quiz" && question && options && options.length > 0) {
    const qLower = question.toLowerCase();

    // Practical tips based on question keywords
    if (qLower.includes("which") || qLower.includes("what")) {
      tips.push(`Try checking each option one by one — ask yourself "does this match exactly what the question asks?" For example, if it says "which is safest", think about real danger levels. 🔍`);
    }
    if (qLower.includes("best") || qLower.includes("most")) {
      tips.push(`All options might seem partly right. Compare them like this: "Would option A work better than option B in real life?" Pick the one that works in the MOST situations. 🤔`);
    }
    if (qLower.includes("not") || qLower.includes("except") || qLower.includes("least")) {
      tips.push(`This is a trick question! It's asking for the ODD ONE OUT. Try flipping it — check which 3 options DO fit, and the remaining one is your answer. ⚠️`);
    }
    if (qLower.includes("why") || qLower.includes("reason")) {
      tips.push(`Think about cause and effect. For example, "Why do we lock our doors? Because it prevents break-ins." Look for the option that explains the CAUSE, not just describes what happens. 💡`);
    }
    if (qLower.includes("how") || qLower.includes("step")) {
      tips.push(`Picture yourself actually doing this right now. Which option describes what you'd REALLY do first? Think of it like following a recipe — what's the logical first step? 🛠️`);
    }
    if (qLower.includes("first") || qLower.includes("priority")) {
      tips.push(`Imagine everything goes wrong at once. Which action would you do BEFORE anything else? The foundation must come first — like putting on shoes before running! 🏗️`);
    }

    // Check if options have very different lengths (common trap)
    const lengths = options.map(o => o.length);
    const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const hasOutlier = lengths.some(l => l > avgLen * 1.8);
    if (hasOutlier) {
      tips.push(`Don't just pick the longest or shortest answer! Read each option as if it were the only choice — does it actually answer the question? 📏`);
    }

    // Tip referencing specific options
    if (options.some(o => o.toLowerCase().includes("all of") || o.toLowerCase().includes("none of"))) {
      tips.push(`"All of the above" or "None of the above" — test EVERY other option first. If even ONE doesn't fit for "all", or ONE does fit for "none", eliminate it! 🧐`);
    }

    // Give a concrete elimination strategy
    if (options.length >= 4) {
      tips.push(`Elimination trick: Cross out options you're 100% sure are wrong. Usually you can remove 2 right away, making it a 50/50 choice! 🎯`);
    }
  }

  if (stepType === "info" && content) {
    const cl = content.toLowerCase();
    if (cl.includes("important") || cl.includes("key") || cl.includes("essential")) {
      tips.push("There's a KEY point here — try to find the ONE sentence you'd highlight if this were a textbook. That's likely the quiz question! 📌");
    }
    if (content.length > 300) {
      tips.push("Long section! Try the 'one sentence summary' trick: after reading, say in your own words what this section taught you. If you can't, re-read the first and last sentences. 🧠");
    }
    if (cl.includes("example") || cl.includes("for instance")) {
      tips.push("This example will probably appear in a quiz! Try changing the example slightly in your head — like swapping the names or numbers — to make sure you understand the CONCEPT, not just memorized the example. 👀");
    }
    if (cl.includes("never") || cl.includes("always") || cl.includes("must")) {
      tips.push("Words like 'never', 'always', or 'must' usually signal important rules that show up in quizzes. Make a mental note of what you should ALWAYS or NEVER do! ⚡");
    }
  }

  if (stepType === "drag") {
    tips.push("Start with the items you're MOST confident about. Put the obvious first and last items, then fill in the middle. Think: 'What HAS to happen before this other thing?' 📋");
    tips.push("Imagine doing these steps in real life, like a cooking recipe. What would happen if you swapped two steps? If it would cause a problem, you know the order matters! 🎯");
  }

  if (learningCode && learningCode.length === 9) {
    const d = learningCode.split("").map(x => parseInt(x) || 1);
    if (d[0] >= 2 && recentAccuracy < 0.6) {
      tips.push("You're going fast but missing some — try the 'read twice' trick: skim once quickly, then read again slowly focusing on details. Your accuracy will jump! 🐢✨");
    }
    if (d[1] >= 2 && stepType === "quiz") {
      tips.push("You're a visual learner! Try picturing this scenario like a movie scene. Where are you? What do you see? The right answer often 'looks right' when you visualize it. 🎨");
    }
    if (d[3] >= 2) {
      tips.push("You learn by doing! Imagine physically performing each option. Which one 'feels' like the right action? Trust your body's instinct! 💪");
    }
  }

  if (recentAccuracy < 0.4) {
    tips.push("Struggling? That's totally normal — it means you're learning something NEW! Try reading the info sections more slowly and look for the main point before moving on. 🌱");
  }
  if (recentAccuracy >= 0.9 && stepType === "quiz") {
    tips.push("You're crushing it! At this point, trust your first instinct — research shows your gut feeling is usually right when you know the material! 🔥");
  }

  return tips[Math.floor(Math.random() * tips.length)] || "Take your time with this one — think about how it connects to real life! 🐧";
}

const PebbleTip = (props: PebbleTipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Pick a random position each time the question changes
  const position = useMemo(() => {
    return POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  }, [props.question, props.stepType, props.content]);

  // Generate tip based on current context
  const tip = useMemo(() => generateTip(props), [props.question, props.stepType, props.content, props.recentAccuracy, props.learningCode]);

  const handleToggle = () => setIsOpen(!isOpen);

  // Determine slide direction based on position
  const isLeft = position.includes("left-4");
  const isTop = position.includes("top-");

  return (
    <>
      {/* Always-visible tip button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
          onClick={handleToggle}
          className={`${position} z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}
          aria-label="Get a tip from Pebble"
        >
          <Lightbulb className="w-5 h-5" />
        </motion.button>
      )}

      {/* Tip bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: isLeft ? -320 : 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isLeft ? -320 : 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`${position} z-50 max-w-[300px]`}
          >
            <button onClick={handleToggle} className="w-full text-left">
              <div className="bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-xl">
                <div className="flex items-start gap-3">
                  <motion.img
                    src={mascotImg}
                    alt="Pebble"
                    className="w-12 h-12 object-contain shrink-0"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div>
                    <p className="text-xs font-semibold text-primary mb-1">Pebble's Tip 💡</p>
                    <p className="text-sm text-foreground leading-snug">{tip}</p>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 text-center">Tap to dismiss</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PebbleTip;
