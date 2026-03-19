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
  pathId?: string | null;
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

function generateTip({ learningCode, stepType, recentAccuracy, question, options, content, pathId }: PebbleTipProps): string {
  const tips: string[] = [];

  if (stepType === "quiz" && question && options && options.length > 0) {
    const qLower = question.toLowerCase();

    if (pathId === "chronos") {
      tips.push("Chronos tip: imagine the moment in order, like frames in a short movie. Which answer happens at the right time or in the right sequence? ⏳");
    }
    if (pathId === "syntax") {
      tips.push("Syntax tip: scan each option like debugging code. Which choice has the exact rule or detail from the lesson, and which ones have one broken part? 💻");
    }
    if (pathId === "treasury") {
      tips.push("Treasury tip: think of the safest smart money move in real life. If you had to explain your choice to a friend, which option would sound most practical? 🪙");
    }

    if (qLower.includes("which") || qLower.includes("what")) {
      tips.push("Check each option one by one and ask: does this match what the lesson just taught? If the lesson used an example, compare each option to that example. 🔍");
    }
    if (qLower.includes("best") || qLower.includes("most")) {
      tips.push("More than one option may feel okay. Pick the one that would work best in real life most of the time, not just in one special case. 🤔");
    }
    if (qLower.includes("not") || qLower.includes("except") || qLower.includes("least")) {
      tips.push("Flip the question. Find the options that DO fit first, then the leftover choice is probably the answer. ⚠️");
    }
    if (qLower.includes("why") || qLower.includes("reason")) {
      tips.push("Look for cause and effect. Ask yourself: what action causes this result in the real world? 💡");
    }
    if (qLower.includes("how") || qLower.includes("step")) {
      tips.push("Pretend you are doing it right now. Which option sounds like the real action you would actually take? 🛠️");
    }
    if (qLower.includes("first") || qLower.includes("priority")) {
      tips.push("Think foundation first. What would have to happen before the other options could even work? 🏗️");
    }

    if (options.some(o => o.toLowerCase().includes("all of") || o.toLowerCase().includes("none of"))) {
      tips.push("Test each normal option first. If even one breaks the rule, you can remove 'all' or 'none' fast. 🧐");
    }

    if (options.length >= 4) {
      tips.push("Quick strategy: remove two weak options first, then compare the final two using one lesson fact or example. 🎯");
    }
  }

  if (stepType === "info" && content) {
    const cl = content.toLowerCase();
    if (cl.includes("important") || cl.includes("key") || cl.includes("essential")) {
      tips.push("Try this: say the main rule in one short sentence. That sentence is often what the next question tests. 📌");
    }
    if (content.length > 300) {
      tips.push("Long section? Read the first sentence, middle idea, and final sentence. Then ask: what practical action or example did this section teach? 🧠");
    }
    if (cl.includes("example") || cl.includes("for instance")) {
      tips.push("The example matters. Change one detail in the example in your head and see if the rule still works — that helps you understand, not just memorize. 👀");
    }
    if (cl.includes("never") || cl.includes("always") || cl.includes("must")) {
      tips.push("Words like 'always' and 'never' are quiz magnets. Keep that rule in mind before you continue. ⚡");
    }
  }

  if (stepType === "drag") {
    tips.push("Start with the step you know must come first in real life, then place the step that clearly comes last. Fill the middle after that. 📋");
    tips.push("Pretend you're teaching the process to someone else. If one step sounds impossible before another, swap them. 🎯");
  }

  if (learningCode && learningCode.length === 9) {
    const d = learningCode.split("").map(x => parseInt(x) || 1);
    if (d[0] >= 2 && recentAccuracy < 0.6) {
      tips.push("Slow it down a bit. Read once for the big idea, then once for the detail the question might test. 🐢");
    }
    if (d[1] >= 2 && stepType === "quiz") {
      tips.push("Picture the lesson as a scene. Which option matches what you can clearly imagine happening? 🎨");
    }
    if (d[3] >= 2) {
      tips.push("Act it out in your head. Which option feels like the real move someone would make? 💪");
    }
  }

  if (recentAccuracy < 0.4) {
    tips.push("You are learning something new, so go practical: what is one real example from the lesson that matches this question? 🌱");
  }
  if (recentAccuracy >= 0.9 && stepType === "quiz") {
    tips.push("You know this well — use the lesson detail that best proves your answer, then trust it. 🔥");
  }

  return tips[Math.floor(Math.random() * tips.length)] || "Use the lesson example and ask which option would make sense in real life. 🐧";
}

const PebbleTip = (props: PebbleTipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Pick a random position each time the question changes
  const position = useMemo(() => {
    return POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  }, [props.question, props.stepType, props.content]);

  // Generate tip based on current context
  const tip = useMemo(() => generateTip(props), [props.question, props.stepType, props.content, props.recentAccuracy, props.learningCode, props.pathId]);

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
