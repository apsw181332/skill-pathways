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

function generateTip({ learningCode, stepType, recentAccuracy, question, options, correctIndex, content }: PebbleTipProps): string {
  const tips: string[] = [];

  if (stepType === "quiz" && question) {
    const qLower = question.toLowerCase();
    if (qLower.includes("which") || qLower.includes("what")) {
      tips.push(`Look for the keyword in "${question.slice(0, 50)}…" that distinguishes the right answer! 🔍`);
    }
    if (qLower.includes("best") || qLower.includes("most")) {
      tips.push(`Multiple answers may seem partly correct — compare them to find the BEST one! 🤔`);
    }
    if (qLower.includes("not") || qLower.includes("except") || qLower.includes("least")) {
      tips.push(`NEGATIVE question! You're looking for what DOESN'T fit. ⚠️`);
    }
    if (qLower.includes("why") || qLower.includes("reason")) {
      tips.push(`Think cause-and-effect — pick the answer that explains WHY, not just what sounds good! 💡`);
    }
    if (qLower.includes("how") || qLower.includes("step")) {
      tips.push(`Think about what you'd actually DO in real life! 🛠️`);
    }
    if (qLower.includes("first") || qLower.includes("priority")) {
      tips.push(`What must happen BEFORE everything else? Think about the foundation! 🏗️`);
    }
    if (options && options.length > 0) {
      const hasAllNone = options.some(o => o.toLowerCase().includes("all of") || o.toLowerCase().includes("none of"));
      if (hasAllNone) tips.push("Check if EVERY other option is true/false before picking 'all/none of the above'! 🧐");
      if (options.filter(o => o.length > 40).length >= 2) tips.push("Read each detailed option fully — the devil is in the details! 📖");
    }
  }

  if (stepType === "info" && content) {
    const cl = content.toLowerCase();
    if (cl.includes("important") || cl.includes("key") || cl.includes("essential")) tips.push("This section has KEY info — identify the main takeaway! 📌");
    if (content.length > 300) tips.push("Long section — try summarizing it in one sentence! 🧠");
    if (cl.includes("example") || cl.includes("for instance")) tips.push("Pay attention to examples — they often appear as quiz questions! 👀");
  }

  if (stepType === "drag") {
    tips.push("Think about logical sequence: what MUST happen before something else? 📋");
    tips.push("Start with what you're most confident about — the first and last items! 🎯");
  }

  if (learningCode && learningCode.length === 9) {
    const d = learningCode.split("").map(x => parseInt(x) || 1);
    if (d[0] >= 2 && recentAccuracy < 0.6) tips.push("Accuracy dropped — try re-reading more slowly! 🐢✨");
    if (d[4] >= 2 && stepType === "info") tips.push("Try jotting down the key point — writing helps you remember! ✍️");
    if (d[1] >= 2 && stepType === "quiz") tips.push("Try picturing this scenario in your mind! 🎨");
    if (d[3] >= 2) tips.push("Imagine yourself doing this step by step! 💪");
  }

  if (recentAccuracy < 0.4) tips.push("Don't worry about mistakes — take a breath and try carefully! 🌱");
  if (recentAccuracy >= 0.9 && stepType === "quiz") tips.push("You're on fire! Trust your instincts! 🔥");

  return tips[Math.floor(Math.random() * tips.length)] || "Read carefully — you've got this! 🐧";
}

const PebbleTip = (props: PebbleTipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Generate tip instantly based on current question context
  const tip = useMemo(() => generateTip(props), [props.question, props.stepType, props.content, props.recentAccuracy, props.learningCode]);

  const handleToggle = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Always-visible tip button */}
      {!isOpen && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={handleToggle}
          className="fixed right-4 bottom-24 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
          aria-label="Get a tip from Pebble"
        >
          <Lightbulb className="w-5 h-5" />
        </motion.button>
      )}

      {/* Tip bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-4 bottom-24 z-50 max-w-[280px]"
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
