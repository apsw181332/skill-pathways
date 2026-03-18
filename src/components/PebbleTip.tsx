import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/**
 * Generate a contextual tip based on the actual question/content and user's learning profile.
 * Tips are specific to the question, not generic.
 */
function generateTip({ learningCode, stepType, recentAccuracy, question, options, correctIndex, content }: PebbleTipProps): string {
  const tips: string[] = [];

  // Question-specific tips for quiz steps
  if (stepType === "quiz" && question) {
    // Analyze the question text to give specific guidance
    const qLower = question.toLowerCase();
    
    if (qLower.includes("which") || qLower.includes("what")) {
      tips.push(`Read the question again carefully: "${question.slice(0, 60)}..." — look for the keyword that distinguishes the right answer! 🔍`);
    }
    if (qLower.includes("best") || qLower.includes("most")) {
      tips.push(`This asks for the BEST option — multiple answers might seem partly correct, but one stands out. Compare them carefully! 🤔`);
    }
    if (qLower.includes("not") || qLower.includes("except") || qLower.includes("least")) {
      tips.push(`Watch out! This is a NEGATIVE question — you're looking for what DOESN'T fit. Read each option and ask "does this belong?" ⚠️`);
    }
    if (qLower.includes("why") || qLower.includes("reason")) {
      tips.push(`Think about the cause-and-effect here. What's the underlying reason? Don't pick an answer that just sounds good — pick the one that explains WHY! 💡`);
    }
    if (qLower.includes("how") || qLower.includes("step")) {
      tips.push(`This is asking about a process or method. Think about what you'd actually DO in real life! 🛠️`);
    }
    if (qLower.includes("first") || qLower.includes("priority")) {
      tips.push(`Priority question! Think about what must happen BEFORE everything else. What's the foundation? 🏗️`);
    }

    // Option-based hints (without revealing the answer)
    if (options && options.length > 0) {
      const longOptions = options.filter(o => o.length > 40);
      if (longOptions.length >= 2) {
        tips.push("Some options are quite detailed — read each one fully before deciding. The devil is in the details! 📖");
      }
      
      // Check for "all of the above" or "none of the above" type answers
      const hasAllNone = options.some(o => o.toLowerCase().includes("all of") || o.toLowerCase().includes("none of"));
      if (hasAllNone) {
        tips.push("When you see 'all of the above' or 'none of the above', check if EVERY other option is true/false first! 🧐");
      }
    }
  }

  // Content-specific tips for info steps  
  if (stepType === "info" && content) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes("important") || contentLower.includes("key") || contentLower.includes("essential")) {
      tips.push("This section has KEY information — try to identify the main takeaway before moving on! 📌");
    }
    if (content.length > 300) {
      tips.push("This is a longer section. Try summarizing it in one sentence in your head before continuing! 🧠");
    }
    if (contentLower.includes("example") || contentLower.includes("for instance")) {
      tips.push("Pay attention to the examples — they often show up as quiz questions later! 👀");
    }
  }

  // Drag step tips
  if (stepType === "drag") {
    tips.push("Think about the logical sequence: what MUST happen before something else can happen? 📋");
    tips.push("If you're unsure, start with what you're most confident about — the first and last items! 🎯");
  }

  // Learning code-driven tips (specific to user profile)
  if (learningCode && learningCode.length === 9) {
    const digits = learningCode.split("").map(d => parseInt(d) || 1);
    const [speed, visual, auditory, kinesthetic, readWrite, attention, , complexity] = digits;

    // Speed + accuracy mismatch — this is the "slow down" scenario
    if (speed >= 2 && recentAccuracy < 0.6) {
      tips.push("I noticed you're going fast but your accuracy has dropped — try re-reading the question more slowly this time! 🐢✨");
    }
    if (speed <= 0 && recentAccuracy >= 0.8) {
      tips.push("Your careful approach is paying off — great accuracy! Keep that thorough mindset! 🌟");
    }

    if (attention === 0 && stepType === "quiz") {
      tips.push("Focus on just the question — block out everything else for a moment. What is it actually asking? 🎯");
    }

    if (complexity === 0 && stepType === "quiz") {
      tips.push("Don't overthink it — look for the simplest, most straightforward answer! 😊");
    }
    if (complexity >= 2 && stepType === "quiz") {
      tips.push("Think about the deeper 'why' behind each option — the nuance matters here! 🧠");
    }

    if (visual >= 2 && stepType === "quiz") {
      tips.push("Try picturing this scenario in your mind — visualizing helps you find the answer! 🎨");
    }
    if (kinesthetic >= 2) {
      tips.push("Imagine yourself actually doing this — what would you do step by step? 💪");
    }
    if (auditory >= 2 && stepType === "quiz") {
      tips.push("Try reading the question out loud — sometimes hearing it helps! 🔊");
    }
    if (readWrite >= 2 && stepType === "info") {
      tips.push("Try jotting down the key point from this section — writing helps you remember! ✍️");
    }
  }

  // Accuracy-based encouragement
  if (recentAccuracy < 0.4) {
    tips.push("Don't worry about mistakes — each one teaches you something. Take a breath and try carefully! 🌱");
  }
  if (recentAccuracy >= 0.9 && stepType === "quiz") {
    tips.push("You're on fire! Trust your instincts on this one! 🔥");
  }

  return tips[Math.floor(Math.random() * tips.length)] || "Take your time and read carefully — you've got this! 🐧";
}

const PebbleTip = (props: PebbleTipProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tip, setTip] = useState("");
  const [showPeek, setShowPeek] = useState(false);
  const stepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stepStartRef = useRef(Date.now());

  // Reset when step changes — hide tip, start timer for auto-peek
  useEffect(() => {
    setIsOpen(false);
    setShowPeek(false);
    stepStartRef.current = Date.now();

    // Clear previous timer
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);

    // Only auto-show peek after delay for quiz/drag steps (user might be stuck)
    if (props.stepType === "quiz" || props.stepType === "drag") {
      stepTimerRef.current = setTimeout(() => {
        // Only show if user hasn't moved to next step
        setShowPeek(true);
      }, 12000); // 12 seconds — user is likely stuck
    } else if (props.stepType === "info") {
      // For info steps, show after 20 seconds (reading time)
      stepTimerRef.current = setTimeout(() => {
        setShowPeek(true);
      }, 20000);
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [props.question, props.stepType, props.content]);

  const handleToggle = () => {
    if (!isOpen) {
      setTip(generateTip(props));
      setShowPeek(false);
    }
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Penguin peeking from right side — only shows after delay */}
      <AnimatePresence>
        {!isOpen && showPeek && (
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
              <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Need help?</span>
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
