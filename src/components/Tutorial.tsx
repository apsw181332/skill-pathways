import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, MessageCircle, Settings, Trophy, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";

interface TutorialProps {
  onComplete: () => void;
}

const STEPS = [
  {
    title: "Welcome to Pathways! 🎉",
    description: "I'm Pebble, your learning buddy! Let me show you around so you can make the most of your experience.",
    icon: Home,
    mascotMsg: "So excited to have you here! Let me give you the grand tour! 🐧",
    animation: "celebrate" as const,
  },
  {
    title: "Browse & Enroll in Courses",
    description: "Head to the Learn tab to explore all available skill paths. You can enroll in up to 3 courses at a time. Search for topics that interest you!",
    icon: BookOpen,
    mascotMsg: "There are tons of courses to explore! Pick up to 3 at a time. 📚",
    animation: "bounce" as const,
  },
  {
    title: "Chat with Me Anytime!",
    description: "See that chat bubble in the bottom right? Tap it to ask me anything about courses, lessons, or how to use the app. I'm always here to help!",
    icon: MessageCircle,
    mascotMsg: "I can answer questions about any course topic! Just ask! 💬",
    animation: "wave" as const,
  },
  {
    title: "Earn XP & Climb the Ranks",
    description: "Complete lessons to earn XP, maintain your streak, and unlock badges. Check the leaderboard to see how you compare with other learners!",
    icon: Trophy,
    mascotMsg: "Every lesson earns you XP. Can you reach the top of the leaderboard? 🏆",
    animation: "celebrate" as const,
  },
  {
    title: "Customize Your Experience",
    description: "Go to Settings to change your theme color, toggle sound effects, and turn on voice narration so I can read lessons aloud for you!",
    icon: Settings,
    mascotMsg: "Make Pathways feel like YOUR app! Change colors, sounds, and more! ⚙️",
    animation: "bounce" as const,
  },
];

const Tutorial = ({ onComplete }: TutorialProps) => {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>

        <Mascot message={current.mascotMsg} size="sm" animation={current.animation} className="mb-6" />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lesson-card text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Icon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3">{current.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{current.description}</p>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={onComplete}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tutorial
          </button>
          <Button
            onClick={() => {
              if (step < STEPS.length - 1) setStep(step + 1);
              else onComplete();
            }}
            className="gap-2"
          >
            {step === STEPS.length - 1 ? "Let's go!" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Tutorial;
