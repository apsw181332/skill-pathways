import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import XpPopup from "@/components/XpPopup";
import { supabase } from "@/integrations/supabase/client";
import { playCorrectSound, playWrongSound, playClickSound, playSuccessSound } from "@/hooks/useSoundEffects";

interface LessonViewProps {
  onBack: () => void;
  userId?: string;
  categoryId?: string;
  lessonId?: number;
}

const STEPS = [
  {
    type: "info" as const,
    title: "What is an emergency fund?",
    content:
      "An emergency fund is money set aside for unplanned expenses — a car repair, medical bill, or sudden job loss. It's the foundation of financial stability.",
    mascotMsg: "Let's learn about one of the most important money skills! 💪",
  },
  {
    type: "quiz" as const,
    title: "Quick check",
    question: "How many months of expenses should an emergency fund ideally cover?",
    options: ["1 month", "3–6 months", "12 months", "It doesn't matter"],
    correct: 1,
    explanation:
      "Most financial experts recommend 3–6 months of living expenses. This gives you enough runway to handle most unexpected situations without going into debt.",
    mascotMsg: "Time for a quiz! You've got this! 🤔",
  },
  {
    type: "drag" as const,
    title: "Sort these priorities",
    instruction: "Tap the items in the correct priority order for building your fund:",
    items: [
      { id: "a", text: "Start with $500 goal", order: 1 },
      { id: "b", text: "Automate monthly transfers", order: 2 },
      { id: "c", text: "Build to 1 month of expenses", order: 3 },
      { id: "d", text: "Grow to 3–6 months", order: 4 },
    ],
    mascotMsg: "Put these in order — think step by step! 🧩",
  },
  {
    type: "info" as const,
    title: "Where to keep it",
    content:
      "Keep your emergency fund in a high-yield savings account — separate from your checking account. This keeps it accessible but not too easy to spend. Look for accounts with 4%+ APY and no monthly fees.",
    mascotMsg: "Pro tip incoming! This one's really useful. 📝",
  },
  {
    type: "quiz" as const,
    title: "Final question",
    question: "Which of these is NOT a good use of an emergency fund?",
    options: [
      "Unexpected medical bill",
      "Car transmission repair",
      "A vacation deal you found online",
      "Sudden job loss",
    ],
    correct: 2,
    explanation:
      "Emergency funds are for genuine emergencies — not planned expenses or lifestyle purchases. That vacation deal, however tempting, should come from a separate savings goal.",
    mascotMsg: "Last one! Let's finish strong! 🏁",
  },
];

const CORRECT_MESSAGES = [
  "Nailed it! You're a natural! 🎉",
  "Brilliant! That's exactly right! ⭐",
  "You're on fire! Keep going! 🔥",
];

const WRONG_MESSAGES = [
  "Not quite, but you're learning! That's what counts. 💪",
  "Almost! Check the explanation — you'll get it next time! 🤓",
  "Don't worry! Mistakes are how we learn best. 📚",
];

const LessonView = ({ onBack, userId, categoryId = "financial", lessonId = 1 }: LessonViewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [dragSubmitted, setDragSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showXp, setShowXp] = useState(false);
  const [xpAmount, setXpAmount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [feedbackMascotMsg, setFeedbackMascotMsg] = useState<string | null>(null);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const triggerXp = (amount: number) => {
    setXpAmount(amount);
    setShowXp(true);
    setTotalXp((prev) => prev + amount);
    setTimeout(() => setShowXp(false), 1500);
  };

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);

    if (step.type === "quiz") {
      if (idx === step.correct) {
        setFeedbackMascotMsg(CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)]);
        triggerXp(15);
        playCorrectSound();
      } else {
        setFeedbackMascotMsg(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]);
        triggerXp(5);
        playWrongSound();
      }
    }
  };

  const handleOrderItem = (id: string) => {
    if (dragSubmitted) return;
    playClickSound();
    if (orderedItems.includes(id)) {
      setOrderedItems(orderedItems.filter((i) => i !== id));
    } else {
      setOrderedItems([...orderedItems, id]);
    }
  };

  const handleSubmitOrder = () => {
    setDragSubmitted(true);
    setFeedbackMascotMsg("Great effort! Ordering steps is key to building good habits. 📋");
    triggerXp(20);
    playCorrectSound();
  };

  const saveLessonProgress = async (earnedXp: number) => {
    if (!userId) return;

    try {
      // Save lesson completion to user_progress
      await supabase.from("user_progress").upsert({
        user_id: userId,
        category_id: categoryId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
        score: earnedXp,
      }, { onConflict: "user_id,category_id,lesson_id" });

      // Update profile XP, streak, and last_activity_date
      const { data: profile } = await supabase
        .from("profiles")
        .select("xp, streak, last_activity_date")
        .eq("user_id", userId)
        .single();

      if (profile) {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        const lastActive = profile.last_activity_date;

        let newStreak = profile.streak;
        if (lastActive === yesterday) {
          newStreak = profile.streak + 1;
        } else if (lastActive !== today) {
          newStreak = 1;
        }

        await supabase.from("profiles").update({
          xp: profile.xp + earnedXp,
          streak: newStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
      }

      // Check and award "first-lesson" badge
      const { data: existing } = await supabase
        .from("achievements")
        .select("id")
        .eq("user_id", userId)
        .eq("badge_id", "first-lesson")
        .maybeSingle();

      if (!existing) {
        await supabase.from("achievements").insert({
          user_id: userId,
          badge_id: "first-lesson",
        });
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const handleNext = () => {
    playClickSound();
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setOrderedItems([]);
      setDragSubmitted(false);
      setFeedbackMascotMsg(null);
    } else {
      // Lesson complete — save to DB
      saveLessonProgress(totalXp);
      setShowConfetti(true);
      playSuccessSound();
      setTimeout(() => {
        setShowConfetti(false);
        onBack();
      }, 2500);
    }
  };

  const canProceed =
    step.type === "info" ||
    (step.type === "quiz" && showFeedback) ||
    (step.type === "drag" && dragSubmitted);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Confetti active={showConfetti} />
      <XpPopup amount={xpAmount} show={showXp} />

      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back to dashboard">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              className="progress-fill h-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            />
          </div>
          <span className="text-sm font-medium text-accent xp-counter">
            {totalXp} XP
          </span>
          <span className="text-sm text-muted-foreground xp-counter">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-6 w-full">
        <motion.div
          key={`mascot-${currentStep}-${feedbackMascotMsg}`}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <Mascot
            message={feedbackMascotMsg || step.mascotMsg}
            size="sm"
            animation={feedbackMascotMsg ? (feedbackMascotMsg.includes("Nailed") || feedbackMascotMsg.includes("Brilliant") || feedbackMascotMsg.includes("fire") ? "celebrate" : "bounce") : "idle"}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
          >
            <h2 className="text-2xl font-semibold text-foreground mb-6">{step.title}</h2>

            {step.type === "info" && (
              <div className="lesson-card">
                <p className="text-foreground leading-relaxed text-lg">{step.content}</p>
              </div>
            )}

            {step.type === "quiz" && (
              <div>
                <p className="text-foreground text-lg mb-6">{step.question}</p>
                <div className="space-y-3">
                  {step.options.map((opt, idx) => {
                    let borderClass = "";
                    if (showFeedback && idx === step.correct) borderClass = "border-primary bg-primary/5";
                    else if (showFeedback && idx === selectedAnswer && idx !== step.correct)
                      borderClass = "border-destructive bg-destructive/5";

                    return (
                      <motion.button
                        key={idx}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(idx)}
                        className={`lesson-card w-full text-left flex items-center gap-3 ${borderClass} ${
                          !showFeedback && selectedAnswer === idx ? "border-primary" : ""
                        }`}
                        disabled={showFeedback}
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-medium text-foreground">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-foreground">{opt}</span>
                        {showFeedback && idx === step.correct && (
                          <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />
                        )}
                        {showFeedback && idx === selectedAnswer && idx !== step.correct && (
                          <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-lg border-2 ${
                      selectedAnswer === step.correct
                        ? "border-primary/30 bg-primary/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground mb-1">
                      {selectedAnswer === step.correct ? "Correct! ✓" : "Not quite."}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.explanation}</p>
                  </motion.div>
                )}
              </div>
            )}

            {step.type === "drag" && (
              <div>
                <p className="text-foreground text-lg mb-6">{step.instruction}</p>

                <div className="space-y-2 mb-6">
                  {orderedItems.map((id, idx) => {
                    const item = step.items.find((i) => i.id === id)!;
                    const isCorrect = dragSubmitted && item.order === idx + 1;
                    const isWrong = dragSubmitted && item.order !== idx + 1;
                    return (
                      <motion.div
                        key={id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`lesson-card flex items-center gap-3 py-3 ${
                          isCorrect ? "border-primary" : isWrong ? "border-destructive" : ""
                        }`}
                      >
                        <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
                          {idx + 1}
                        </span>
                        <span className="text-foreground">{item.text}</span>
                        {!dragSubmitted && (
                          <button
                            onClick={() => handleOrderItem(id)}
                            className="ml-auto text-muted-foreground hover:text-destructive text-xs"
                          >
                            Remove
                          </button>
                        )}
                        {dragSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                        {dragSubmitted && isWrong && <XCircle className="w-4 h-4 text-destructive ml-auto" />}
                      </motion.div>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  {step.items
                    .filter((i) => !orderedItems.includes(i.id))
                    .map((item) => (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleOrderItem(item.id)}
                        className="w-full p-4 border-2 border-dashed border-border rounded-lg text-left text-foreground hover:border-primary transition-colors"
                      >
                        {item.text}
                      </motion.button>
                    ))}
                </div>

                {orderedItems.length === step.items.length && !dragSubmitted && (
                  <Button className="mt-4" onClick={handleSubmitOrder}>
                    Check order
                  </Button>
                )}

                {dragSubmitted && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5"
                  >
                    <p className="text-sm text-foreground">
                      The correct order is: start small ($500), automate transfers, build to 1 month, then grow to 3–6 months.
                    </p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full gap-2"
            size="lg"
          >
            {currentStep === STEPS.length - 1 ? "🎉 Complete lesson" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
