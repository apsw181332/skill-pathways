import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-penguin.png";

interface PebbleTipProps {
  learningCode?: string | null;
  stepType: "info" | "quiz" | "drag";
  question?: string;
  recentAccuracy: number;
}

function generateTip({ learningCode, stepType, recentAccuracy, question }: PebbleTipProps): string {
  const tips: string[] = [];

  if (learningCode && learningCode.length === 9) {
    const digits = learningCode.split("").map(d => parseInt(d) || 1);
    const [speed, visual, auditory, kinesthetic, readWrite, attention, , complexity] = digits;

    // Speed + accuracy mismatch
    if (speed >= 2 && recentAccuracy < 0.6) {
      tips.push("You're going fast but missing some answers — try slowing down and reading each word carefully! 🐢✨");
    }
    if (speed <= 0 && recentAccuracy >= 0.8) {
      tips.push("You're being thorough and it's paying off — great accuracy! Keep it up! 🌟");
    }

    // Attention span tips
    if (attention === 0) {
      tips.push("Try focusing on just one key idea at a time — you've got this! 🎯");
      tips.push("Break it down: what's the single most important word in this section? 🧩");
    }
    if (attention === 0 && stepType === "info") {
      tips.push("This is a good spot to take a quick breath before moving on! 😌");
    }

    // Complexity tips
    if (complexity === 0 && stepType === "quiz") {
      tips.push("Don't overthink it — look for the simplest, most straightforward answer! 😊");
    }
    if (complexity >= 2 && stepType === "quiz") {
      tips.push("Think about the deeper 'why' behind each option — the nuance matters here! 🧠");
    }

    // Learning style tips
    if (readWrite >= 2 && stepType === "info") {
      tips.push("Try jotting down the key points — writing helps you remember! ✍️");
    }
    if (kinesthetic >= 2) {
      tips.push("Think about how you'd actually do this in real life — that'll help you find the answer! 💪");
    }
    if (visual >= 2 && stepType === "quiz") {
      tips.push("Picture the scenario in your head — visualizing helps! 🎨");
    }
    if (visual >= 2 && stepType === "info") {
      tips.push("Try drawing a quick diagram of what you just read! 📊");
    }
    if (auditory >= 2) {
      tips.push("Try reading the question out loud to yourself — hearing it helps! 🔊");
    }
  }

  // Generic tips by step type
  if (stepType === "quiz") {
    tips.push("Look for keywords in the question that match one of the options! 🔍");
    tips.push("If you're stuck, try eliminating answers you know are wrong first! ❌→✅");
    if (recentAccuracy >= 0.8) {
      tips.push("You're on a roll! Trust your instincts on this one! 🔥");
    }
  }
  if (stepType === "drag") {
    tips.push("Think step-by-step: what needs to happen first, second, third? 📋");
    tips.push("Imagine doing this yourself — what would be the logical order? 🤔");
  }
  if (stepType === "info") {
    tips.push("Try to summarize what you just read in one sentence! 📝");
    tips.push("Focus on the key points — what's the main takeaway? 🎯");
  }

  // Accuracy-based tips
  if (recentAccuracy < 0.4) {
    tips.push("Don't worry about mistakes — each one teaches you something new! 🌱");
    tips.push("Take a deep breath. Re-read the question slowly — you'll spot the answer! 🧘");
  }

  return tips[Math.floor(Math.random() * tips.length)] || "You're doing great — keep going! 🐧";
}

const PebbleTip = (props: PebbleTipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tip, setTip] = useState("");

  // Reset when step changes
  useEffect(() => {
    setIsOpen(false);
  }, [props.question, props.stepType]);

  const handleToggle = () => {
    if (!isOpen) {
      setTip(generateTip(props));
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Penguin peeking from right side */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ x: 50 }}
            animate={{ x: 0 }}
            exit={{ x: 60 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={handleToggle}
            className="fixed right-0 bottom-32 z-50 flex items-center"
            aria-label="Get a tip from Pebble"
          >
            <div className="bg-card border-2 border-border border-r-0 rounded-l-2xl pl-2 pr-1 py-1.5 shadow-lg flex items-center gap-1">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Tip</span>
              <motion.img
                src={mascotImg}
                alt="Pebble"
                className="w-10 h-10 object-contain"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
              />
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tip bubble */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-4 bottom-28 z-50 max-w-[280px]"
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
