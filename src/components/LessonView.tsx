import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import XpPopup from "@/components/XpPopup";
import { supabase } from "@/integrations/supabase/client";
import { playCorrectSound, playWrongSound, playClickSound, playSuccessSound } from "@/hooks/useSoundEffects";
import { getLessonContent, type LessonStep } from "@/lib/courseData";
import { useTTS } from "@/hooks/useTTS";

interface LessonViewProps {
  onBack: () => void;
  userId?: string;
  categoryId: string;
  lessonId: number;
  soundEnabled: boolean;
  ttsEnabled: boolean;
}

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

const LessonView = ({ onBack, userId, categoryId, lessonId, soundEnabled, ttsEnabled }: LessonViewProps) => {
  const lesson = getLessonContent(categoryId, lessonId);
  const steps = lesson?.steps || [];

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

  const { speak, stop } = useTTS(ttsEnabled);

  const step: LessonStep | undefined = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // TTS: read step content when step changes
  useEffect(() => {
    if (!step) return;
    stop();
    const text = step.content || step.question || step.instruction || "";
    if (text) speak(text);
    return () => stop();
  }, [currentStep, step?.type]);

  if (!lesson || !step) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Mascot message="Oops! This lesson isn't available yet. Check back soon! 🚧" size="md" animation="bounce" />
          <Button onClick={onBack} className="mt-6">Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  const triggerXp = (amount: number) => {
    setXpAmount(amount);
    setShowXp(true);
    setTotalXp(prev => prev + amount);
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
        if (soundEnabled) playCorrectSound();
      } else {
        setFeedbackMascotMsg(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)]);
        triggerXp(5);
        if (soundEnabled) playWrongSound();
      }
    }
  };

  const handleOrderItem = (id: string) => {
    if (dragSubmitted) return;
    if (soundEnabled) playClickSound();
    setOrderedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSubmitOrder = () => {
    setDragSubmitted(true);
    setFeedbackMascotMsg("Great effort! Ordering steps is key to building good habits. 📋");
    triggerXp(20);
    if (soundEnabled) playCorrectSound();
  };

  const saveLessonProgress = async (earnedXp: number) => {
    if (!userId) return;
    try {
      await supabase.from("user_progress").upsert({
        user_id: userId, category_id: categoryId, lesson_id: lessonId,
        completed: true, completed_at: new Date().toISOString(), score: earnedXp,
      }, { onConflict: "user_id,category_id,lesson_id" });

      const { data: profile } = await supabase.from("profiles").select("xp, streak, last_activity_date").eq("user_id", userId).single();
      if (profile) {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        let newStreak = profile.streak;
        if (profile.last_activity_date === yesterday) newStreak = profile.streak + 1;
        else if (profile.last_activity_date !== today) newStreak = 1;

        await supabase.from("profiles").update({
          xp: profile.xp + earnedXp, streak: newStreak, last_activity_date: today, updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
      }

      const { data: existing } = await supabase.from("achievements").select("id").eq("user_id", userId).eq("badge_id", "first-lesson").maybeSingle();
      if (!existing) await supabase.from("achievements").insert({ user_id: userId, badge_id: "first-lesson" });
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const handleNext = () => {
    if (soundEnabled) playClickSound();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setOrderedItems([]);
      setDragSubmitted(false);
      setFeedbackMascotMsg(null);
    } else {
      saveLessonProgress(totalXp);
      setShowConfetti(true);
      if (soundEnabled) playSuccessSound();
      setTimeout(() => { setShowConfetti(false); onBack(); }, 2500);
    }
  };

  const canProceed = step.type === "info" || (step.type === "quiz" && showFeedback) || (step.type === "drag" && dragSubmitted);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Confetti active={showConfetti} />
      <XpPopup amount={xpAmount} show={showXp} />

      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div className="progress-fill h-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <span className="text-sm font-medium text-accent xp-counter">{totalXp} XP</span>
          <span className="text-sm text-muted-foreground xp-counter">{currentStep + 1}/{steps.length}</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-6 w-full">
        <motion.div key={`mascot-${currentStep}-${feedbackMascotMsg}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Mascot
            message={feedbackMascotMsg || step.mascotMsg}
            size="sm"
            animation={feedbackMascotMsg ? (feedbackMascotMsg.includes("Nailed") || feedbackMascotMsg.includes("Brilliant") || feedbackMascotMsg.includes("fire") ? "celebrate" : "bounce") : "idle"}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-2xl font-semibold text-foreground mb-6">{step.title}</h2>

            {step.type === "info" && (
              <div className="lesson-card">
                {step.image && <img src={step.image} alt={step.title} className="w-full h-48 object-cover rounded-lg mb-4" />}
                <p className="text-foreground leading-relaxed text-lg">{step.content}</p>
              </div>
            )}

            {step.type === "quiz" && (
              <div>
                <p className="text-foreground text-lg mb-6">{step.question}</p>
                <div className="space-y-3">
                  {step.options?.map((opt, idx) => {
                    let borderClass = "";
                    if (showFeedback && idx === step.correct) borderClass = "border-primary bg-primary/5";
                    else if (showFeedback && idx === selectedAnswer && idx !== step.correct) borderClass = "border-destructive bg-destructive/5";
                    return (
                      <motion.button key={idx} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(idx)} disabled={showFeedback}
                        className={`lesson-card w-full text-left flex items-center gap-3 ${borderClass} ${!showFeedback && selectedAnswer === idx ? "border-primary" : ""}`}>
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-medium text-foreground">{String.fromCharCode(65 + idx)}</div>
                        <span className="text-foreground">{opt}</span>
                        {showFeedback && idx === step.correct && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                        {showFeedback && idx === selectedAnswer && idx !== step.correct && <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
                {showFeedback && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-lg border-2 ${selectedAnswer === step.correct ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <p className="text-sm font-medium text-foreground mb-1">{selectedAnswer === step.correct ? "Correct! ✓" : "Not quite."}</p>
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
                    const item = step.items?.find(i => i.id === id);
                    if (!item) return null;
                    const isCorrect = dragSubmitted && item.order === idx + 1;
                    const isWrong = dragSubmitted && item.order !== idx + 1;
                    return (
                      <motion.div key={id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`lesson-card flex items-center gap-3 py-3 ${isCorrect ? "border-primary" : isWrong ? "border-destructive" : ""}`}>
                        <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">{idx + 1}</span>
                        <span className="text-foreground">{item.text}</span>
                        {!dragSubmitted && <button onClick={() => handleOrderItem(id)} className="ml-auto text-muted-foreground hover:text-destructive text-xs">Remove</button>}
                        {dragSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                        {dragSubmitted && isWrong && <XCircle className="w-4 h-4 text-destructive ml-auto" />}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {step.items?.filter(i => !orderedItems.includes(i.id)).map(item => (
                    <motion.button key={item.id} whileTap={{ scale: 0.98 }} onClick={() => handleOrderItem(item.id)}
                      className="w-full p-4 border-2 border-dashed border-border rounded-lg text-left text-foreground hover:border-primary transition-colors">
                      {item.text}
                    </motion.button>
                  ))}
                </div>
                {orderedItems.length === (step.items?.length || 0) && !dragSubmitted && (
                  <Button className="mt-4" onClick={handleSubmitOrder}>Check order</Button>
                )}
                {dragSubmitted && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                    <p className="text-sm text-foreground">Great job! Review the correct order above.</p>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleNext} disabled={!canProceed} className="w-full gap-2" size="lg">
            {currentStep === steps.length - 1 ? "🎉 Complete lesson" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
