import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb } from "lucide-react";
import mascotImg from "@/assets/mascot-penguin.png";

interface PebbleTipProps {
  learningCode?: string | null;
  stepType: "info" | "quiz" | "drag" | "type-in";
  question?: string;
  recentAccuracy: number;
  options?: string[];
  correctIndex?: number;
  content?: string;
  pathId?: string | null;
}

const POSITIONS = [
  "fixed right-4 bottom-24",
  "fixed right-4 bottom-40",
  "fixed left-4 bottom-24",
  "fixed left-4 bottom-40",
];

/** Generate a tip about the ACTUAL CONTENT of the lesson, not about how to answer questions */
function generateTip({ stepType, question, content, pathId }: PebbleTipProps): string {
  const tips: string[] = [];

  // Content-based tips: extract key facts from the lesson content and provide relevant context
  if (content) {
    const cl = content.toLowerCase();
    // Financial topics
    if (cl.includes("50/30/20")) tips.push("The 50/30/20 rule was popularized by Senator Elizabeth Warren. It's one of the simplest budgeting frameworks that actually works. 💰");
    if (cl.includes("credit score")) tips.push("Fun fact: credit scores were invented in 1989 by FICO. Before that, lenders judged you by handshake and reputation! 📊");
    if (cl.includes("compound interest")) tips.push("Albert Einstein supposedly called compound interest 'the eighth wonder of the world.' Start early — even $50/month adds up massively. 📈");
    if (cl.includes("emergency fund")) tips.push("78% of Americans live paycheck to paycheck. An emergency fund is literally the difference between a bad week and financial disaster. 🏦");
    if (cl.includes("inflation")) tips.push("$100 in 2000 would need to be about $180 today to have the same buying power. That's why investing matters! 💵");
    // Tech topics
    if (cl.includes("password")) tips.push("The most common password is still '123456'. Hackers can crack it in less than 1 second. A 12-character random password takes centuries! 🔐");
    if (cl.includes("2fa") || cl.includes("two-factor")) tips.push("Google found that adding 2FA blocks 99.9% of automated attacks on your account. It's the single best thing you can do for security. 🛡️");
    if (cl.includes("phishing")) tips.push("Over 3.4 billion phishing emails are sent every day. The FBI reports phishing as the #1 cybercrime. Always check the sender's actual email address! 📧");
    if (cl.includes("cloud")) tips.push("Over 60% of all corporate data is now stored in the cloud. Companies like Netflix run entirely on cloud servers. ☁️");
    if (cl.includes("digital footprint")) tips.push("70% of employers check candidates' social media. What you post today could affect job opportunities years from now. 🌐");
    // Health topics
    if (cl.includes("sleep") || cl.includes("melatonin")) tips.push("NASA found that a 26-minute nap improved pilot performance by 34% and alertness by 54%. Sleep is a superpower! 😴");
    if (cl.includes("exercise") || cl.includes("physical activity")) tips.push("Just 20 minutes of walking releases endorphins equivalent to a mild dose of morphine. Your body has its own pharmacy! 🏃");
    if (cl.includes("vitamin d")) tips.push("About 1 billion people worldwide are vitamin D deficient. 15 minutes of midday sun gives you 10,000-25,000 IU. ☀️");
    if (cl.includes("hydration") || cl.includes("water")) tips.push("Your brain is 75% water. Even 2% dehydration impairs attention and memory. Keep a water bottle nearby! 💧");
    if (cl.includes("mental health")) tips.push("1 in 5 adults experience mental illness each year. Seeking help is as normal and important as seeing a doctor for a broken bone. 🧠");
    // Career topics
    if (cl.includes("resume")) tips.push("The average recruiter spends just 7.4 seconds looking at a resume. Put your strongest achievements in the top third! 📄");
    if (cl.includes("interview")) tips.push("Studies show that the first 5 minutes of an interview determine 60% of the outcome. Your opening matters! 🎯");
    if (cl.includes("star method")) tips.push("The STAR method (Situation, Task, Action, Result) is used by Amazon, Google, and most Fortune 500 companies in interviews. 🌟");
    // Cooking topics
    if (cl.includes("protein")) tips.push("Your body uses 20 different amino acids to build proteins. 9 of them are 'essential' — your body can't make them, so you must eat them. 🥩");
    if (cl.includes("macronutrient")) tips.push("Carbs aren't the enemy! Your brain uses 20% of your daily energy and runs almost entirely on glucose from carbs. 🧠");
  }

  // Question-based tips: provide relevant factual context
  if (question) {
    const ql = question.toLowerCase();
    if (ql.includes("password")) tips.push("A 16-character password with mixed case, numbers, and symbols has 10^28 possible combinations. That's more than atoms in a human body! 🔑");
    if (ql.includes("credit")) tips.push("A good credit score (700+) can save you over $100,000 in interest over your lifetime on mortgages and loans. 💳");
    if (ql.includes("budget")) tips.push("People who write down a budget save 20% more money than those who don't. The act of writing creates accountability. ✍️");
    if (ql.includes("sleep")) tips.push("Lack of sleep costs the US economy $411 billion per year in lost productivity. Good sleep is literally valuable! 💤");
    if (ql.includes("exercise")) tips.push("Regular exercise reduces the risk of heart disease by 35%, diabetes by 50%, and depression by 30%. Movement is medicine! 💪");
  }

  // Path-themed bonus facts
  if (pathId === "chronos") tips.push("The ancient Greeks had two words for time: Chronos (sequential time) and Kairos (the right moment). You're learning to master both! ⏳");
  if (pathId === "syntax") tips.push("There are over 700 programming languages in the world. The first programmer was Ada Lovelace in 1843! 💻");
  if (pathId === "treasury") tips.push("Warren Buffett made 99% of his wealth after age 50. The key was starting to invest at age 11. Time in the market beats timing the market! 🪙");
  if (pathId === "vitality") tips.push("Your body replaces all its cells roughly every 7-10 years. You're literally not the same person you were a decade ago! 🌿");
  if (pathId === "cosmos") tips.push("There are more stars in the universe than grains of sand on Earth. Knowledge is infinite — keep exploring! 🌌");

  return tips[Math.floor(Math.random() * tips.length)] || "Every expert was once a beginner. You're building real knowledge right now! 🐧";
}

const PebbleTip = (props: PebbleTipProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const position = useMemo(() => {
    return POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  }, [props.question, props.stepType, props.content]);

  const tip = useMemo(() => generateTip(props), [props.question, props.stepType, props.content, props.recentAccuracy, props.learningCode, props.pathId]);

  const handleToggle = () => setIsOpen(!isOpen);
  const isLeft = position.includes("left-4");

  return (
    <>
      {!isOpen && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.5 }}
          onClick={handleToggle}
          className={`${position} z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform`}
          aria-label="Get a tip from Pebble"
        >
          <Lightbulb className="w-6 h-6" />
        </motion.button>
      )}

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
                    <p className="text-xs font-semibold text-primary mb-1">Did you know? 💡</p>
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
