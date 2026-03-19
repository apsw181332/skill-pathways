import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, Clock, Target, Zap, Heart, Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import XpPopup from "@/components/XpPopup";
import TreasureChest from "@/components/TreasureChest";
import ReadAloudButton from "@/components/ReadAloudButton";
import PebbleTip from "@/components/PebbleTip";
import { supabase } from "@/integrations/supabase/client";
import { playCorrectSound, playWrongSound, playClickSound, playSuccessSound } from "@/hooks/useSoundEffects";
import { getLessonContent, COURSES, type LessonStep } from "@/lib/courseData";
import { useTranslation, type Locale } from "@/lib/i18n";
import { useTranslatedContent } from "@/hooks/useTranslation";
import { adaptLearningCode, getReadingPaceIntervention } from "@/lib/learningCode";

interface LessonViewProps {
  onBack: () => void;
  onNextLesson?: (categoryId: string, lessonId: number) => void;
  userId?: string;
  categoryId: string;
  lessonId: number;
  soundEnabled: boolean;
  ttsEnabled?: boolean;
  extraLives: number;
  onUseExtraLife: () => void;
  isReview?: boolean;
  locale?: Locale;
  config?: { learningStyle?: string };
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
const COMPLETION_TIPS = [
  "Try teaching what you learned to someone — it's the best way to remember! 🧠",
  "Review this lesson in a few days to lock it in your memory! 📚",
  "Apply what you learned today in a real situation! 💪",
  "Write down one key takeaway from this lesson! ✍️",
  "Challenge a friend to take this lesson too! 🤝",
  "Great learners never stop being curious — keep exploring! 🌟",
  "Consistency beats intensity — come back tomorrow! 🔥",
  "You're building skills that will last a lifetime! 🏆",
];
const COMPLETION_MSGS = [
  "You're absolutely crushing it! 🎉",
  "Look at you go — a natural learner! ⭐",
  "Pebble is SO proud of you right now! 🐧",
  "Another lesson conquered! You're unstoppable! 🚀",
  "Knowledge is power, and you just leveled up! ⚡",
];
const GAME_OVER_MSGS = [
  "Don't give up! Every mistake is a lesson learned. 💪",
  "You'll get it next time! Practice makes perfect. 🎯",
  "Pebble believes in you — try again! 🐧",
];

function shuffle<T>(arr: T[]): T[] {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

function fmtTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const LessonView = ({ onBack, onNextLesson, userId, categoryId, lessonId, soundEnabled, ttsEnabled = false, extraLives, onUseExtraLife, isReview = false, locale = "en", config }: LessonViewProps) => {
  const { t } = useTranslation(locale);
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
  const [startTime] = useState(Date.now());
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [shuffledItems, setShuffledItems] = useState<{ id: string; text: string; order: number }[]>([]);

  // Shuffled quiz options — store original indices so we can map to translated text at render time
  const [shuffledQuiz, setShuffledQuiz] = useState<{ originalIndices: number[]; correctIndex: number } | null>(null);

  // Lives system
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [showLifeLostAnim, setShowLifeLostAnim] = useState(false);

  // Treasure chest
  const [showChest, setShowChest] = useState(false);

  // Reading pace tracking
  const stepStartTime = useRef(Date.now());
  const infoReadTimes = useRef<{ duration: number; contentLength: number }[]>([]);
  const recentQuizResults = useRef<boolean[]>([]);
  const [paceWarning, setPaceWarning] = useState<string | null>(null);
  const [userLearningCode, setUserLearningCode] = useState<string | null>(null);
  const [adaptedContent, setAdaptedContent] = useState<Record<number, { content?: string; mascotMsg?: string }>>({});
  const [adaptingStep, setAdaptingStep] = useState(false);

  // Fetch learning code on mount
  useEffect(() => {
    if (!userId) return;
    supabase.from("profiles").select("learning_code, learning_style").eq("user_id", userId).single()
      .then(({ data }) => {
        if (data) {
          setUserLearningCode((data as any).learning_code || null);
        }
      });
  }, [userId]);

  // AI-rephrase info steps based on learning code
  useEffect(() => {
    if (!userLearningCode || !step || step.type !== "info" || !step.content || adaptedContent[currentStep] || adaptingStep) return;
    setAdaptingStep(true);
    supabase.functions.invoke("adapt-lesson", {
      body: {
        learningCode: userLearningCode,
        lessonTitle: step.title,
        lessonContent: step.content,
        mascotMsg: step.mascotMsg,
        learningStyle: config?.learningStyle || "balanced",
      },
    }).then(({ data }) => {
      if (data?.adapted) {
        setAdaptedContent(prev => ({ ...prev, [currentStep]: { content: data.adapted, mascotMsg: data.adaptedMascotMsg } }));
      }
    }).catch(() => {}).finally(() => setAdaptingStep(false));
  }, [currentStep, userLearningCode, step?.type]);

  const step: LessonStep | undefined = steps[currentStep];
  const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  // Translate current step content when locale != "en"
  const stepTexts = useMemo(() => {
    if (!step) return [];
    const texts: string[] = [step.title, step.mascotMsg];
    if (step.content) texts.push(step.content);
    if (step.question) texts.push(step.question);
    if (step.explanation) texts.push(step.explanation);
    if (step.instruction) texts.push(step.instruction);
    if (step.options) texts.push(...step.options);
    if (step.items) texts.push(...step.items.map(i => i.text));
    return texts;
  }, [currentStep, step]);

  const { translated: translatedTexts } = useTranslatedContent(stepTexts, locale, "educational quiz/lesson");

  // Translate mascot feedback messages
  const allFeedbackTexts = useMemo(() => [
    ...CORRECT_MESSAGES, ...WRONG_MESSAGES, ...COMPLETION_MSGS,
    ...COMPLETION_TIPS, ...GAME_OVER_MSGS,
  ], []);
  const { translated: translatedFeedback } = useTranslatedContent(allFeedbackTexts, locale, "mascot encouragement messages");
  const tFeedback = useMemo(() => {
    if (locale === "en" || translatedFeedback === allFeedbackTexts) return null;
    let i = 0;
    const tCorrect = CORRECT_MESSAGES.map(() => translatedFeedback[i++]);
    const tWrong = WRONG_MESSAGES.map(() => translatedFeedback[i++]);
    const tComplete = COMPLETION_MSGS.map(() => translatedFeedback[i++]);
    const tTips = COMPLETION_TIPS.map(() => translatedFeedback[i++]);
    const tGameOver = GAME_OVER_MSGS.map(() => translatedFeedback[i++]);
    return { correct: tCorrect, wrong: tWrong, complete: tComplete, tips: tTips, gameOver: tGameOver };
  }, [translatedFeedback, locale, allFeedbackTexts]);

  const pickMsg = (origArr: string[], translatedArr?: string[]) => {
    const idx = Math.floor(Math.random() * origArr.length);
    return translatedArr?.[idx] ?? origArr[idx];
  };

  // Build translated step
  const tStep = useMemo(() => {
    if (!step || locale === "en" || translatedTexts === stepTexts) return step;
    let idx = 0;
    const next = () => translatedTexts[idx++] || "";
    const result = { ...step };
    result.title = next();
    result.mascotMsg = next();
    if (step.content) result.content = next();
    if (step.question) result.question = next();
    if (step.explanation) result.explanation = next();
    if (step.instruction) result.instruction = next();
    if (step.options) result.options = step.options.map(() => next());
    if (step.items) result.items = step.items.map(i => ({ ...i, text: next() }));
    return result;
  }, [step, translatedTexts, locale, stepTexts]);

  // Shuffle drag items
  useEffect(() => {
    if (step?.type === "drag" && step.items) {
      setShuffledItems(shuffle(step.items));
    }
  }, [currentStep]);

  // Shuffle quiz options
  useEffect(() => {
    if (step?.type === "quiz" && step.options && step.correct !== undefined) {
      const indexed = step.options.map((text, i) => ({ text, originalIndex: i }));
      const shuffled = shuffle(indexed);
      setShuffledQuiz({
        originalIndices: shuffled.map(s => s.originalIndex),
        correctIndex: shuffled.findIndex(s => s.originalIndex === step.correct),
      });
    } else {
      setShuffledQuiz(null);
    }
  }, [currentStep]);

  // Game over screen
  if (gameOver) {
    const msg = pickMsg(GAME_OVER_MSGS, tFeedback?.gameOver);
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <Mascot message={msg} size="md" animation="bounce" />
          <h2 className="text-2xl font-bold text-foreground mt-6 mb-2">{t("lesson.out_of_lives")}</h2>
          <p className="text-muted-foreground mb-4">{t("lesson.lives_used")}</p>
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2].map(i => (
              <Heart key={i} className="w-8 h-8 text-muted-foreground/30" fill="currentColor" />
            ))}
          </div>
          <div className="lesson-card mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">{correctAnswers}/{totalQuizzes}</div>
                <div className="text-xs text-muted-foreground">{t("general.correct")}</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-foreground">{totalXp} {t("general.xp")}</div>
                <div className="text-xs text-muted-foreground">{t("lesson.earned")}</div>
              </div>
            </div>
          </div>
          {extraLives > 0 && (
            <Button onClick={() => { onUseExtraLife(); setLives(1); setGameOver(false); }} className="w-full mb-3 gap-2" size="lg">
              <Heart className="w-4 h-4" /> {t("lesson.use_extra_life")} ({extraLives})
            </Button>
          )}
          <Button onClick={onBack} variant={extraLives > 0 ? "outline" : "default"} className="w-full" size="lg">
            {t("lesson.back")}
          </Button>
        </motion.div>
      </div>
    );
  }

  // Completion screen
  if (showCompletion && !showChest) {
    const elapsed = Date.now() - startTime;
    const accuracy = totalQuizzes > 0 ? Math.round((correctAnswers / totalQuizzes) * 100) : 100;
    const tip = pickMsg(COMPLETION_TIPS, tFeedback?.tips);
    const msg = pickMsg(COMPLETION_MSGS, tFeedback?.complete);

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <Confetti active={showConfetti} />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full text-center">
          <Mascot message={msg} size="md" animation="celebrate" />
          <h2 className="text-2xl font-bold text-foreground mt-6 mb-2">
            {isReview ? t("lesson.review_complete") : t("lesson.complete")}
          </h2>
          <p className="text-muted-foreground mb-4">{lesson?.title}</p>
          <div className="flex justify-center gap-2 mb-6">
            {[0, 1, 2].map(i => (
              <Heart key={i} className={`w-6 h-6 ${i < lives ? "text-destructive" : "text-muted-foreground/30"}`} fill="currentColor" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="lesson-card py-4">
              <Clock className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-lg font-semibold text-foreground">{fmtTime(elapsed)}</div>
              <div className="text-xs text-muted-foreground">{t("lesson.time")}</div>
            </div>
            <div className="lesson-card py-4">
              <Zap className="w-5 h-5 text-accent mx-auto mb-2" />
              <div className="text-lg font-semibold text-foreground">{isReview ? "0" : totalXp} {t("general.xp")}</div>
              <div className="text-xs text-muted-foreground">{isReview ? t("lesson.review") : t("lesson.earned")}</div>
            </div>
            <div className="lesson-card py-4">
              <Target className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-lg font-semibold text-foreground">{accuracy}%</div>
              <div className="text-xs text-muted-foreground">{t("lesson.accuracy")}</div>
            </div>
          </div>
          <div className="lesson-card text-left mb-6 border-primary/30">
            <p className="text-sm font-medium text-primary mb-1">💡 {t("lesson.pebble_tip")}</p>
            <p className="text-sm text-muted-foreground">{tip}</p>
          </div>
          {isReview ? (
            <Button onClick={onBack} className="w-full gap-2" size="lg">
              {t("lesson.back")}
            </Button>
          ) : (
            <Button onClick={() => setShowChest(true)} className="w-full gap-2" size="lg">
              <Diamond className="w-4 h-4" /> {t("lesson.open_chest")}
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  // Treasure chest overlay
  if (showChest) {
    return (
      <TreasureChest
        onComplete={(gems) => {
          // Save gems in background, navigate immediately
          if (userId) {
            supabase.from("profiles").select("gems").eq("user_id", userId).single()
              .then(({ data: profile }) => {
                if (profile) {
                  supabase.from("profiles").update({ gems: (profile as any).gems + gems } as any).eq("user_id", userId);
                }
              });
          }
          // Auto-advance to next lesson immediately
          const course = COURSES.find(c => c.id === categoryId);
          if (course && onNextLesson) {
            const currentIndex = course.lessons.findIndex(l => l.id === lessonId);
            const nextLesson = course.lessons[currentIndex + 1];
            if (nextLesson) {
              onNextLesson(categoryId, nextLesson.id);
              return;
            }
          }
          onBack();
        }}
        onClose={onBack}
      />
    );
  }

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
    if (isReview || amount === 0) return;
    setXpAmount(amount);
    setShowXp(true);
    setTotalXp(prev => prev + amount);
    setTimeout(() => setShowXp(false), 1500);
  };

  const handleAnswer = (idx: number) => {
    if (showFeedback || !shuffledQuiz) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);

    setTotalQuizzes(prev => prev + 1);
    if (idx === shuffledQuiz.correctIndex) {
      setCorrectAnswers(prev => prev + 1);
      recentQuizResults.current.push(true);
      setFeedbackMascotMsg(pickMsg(CORRECT_MESSAGES, tFeedback?.correct));
      triggerXp(15);
      if (soundEnabled) playCorrectSound();
    } else {
      recentQuizResults.current.push(false);
      setFeedbackMascotMsg(pickMsg(WRONG_MESSAGES, tFeedback?.wrong));
      if (soundEnabled) playWrongSound();
      const newLives = lives - 1;
      setLives(newLives);
      setShowLifeLostAnim(true);
      setTimeout(() => setShowLifeLostAnim(false), 800);
      if (newLives <= 0) {
        if (!isReview) saveLessonProgress(totalXp, false);
        setTimeout(() => setGameOver(true), 1500);
        return;
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
    setTotalQuizzes(prev => prev + 1);
    const allCorrect = orderedItems.every((id, idx) => {
      const item = step.items?.find(i => i.id === id);
      return item && item.order === idx + 1;
    });
    if (allCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setFeedbackMascotMsg("Perfect order! You really understand this! 🎯");
      triggerXp(25);
      if (soundEnabled) playCorrectSound();
    } else {
      setFeedbackMascotMsg("Good try! Check the correct order above. 📋");
      // No XP for wrong answers
      if (soundEnabled) playWrongSound();
      const newLives = lives - 1;
      setLives(newLives);
      setShowLifeLostAnim(true);
      setTimeout(() => setShowLifeLostAnim(false), 800);
      if (newLives <= 0) {
        if (!isReview) saveLessonProgress(totalXp, false);
        setTimeout(() => setGameOver(true), 1500);
        return;
      }
    }
  };

  const saveLessonProgress = async (earnedXp: number, completed: boolean = true) => {
    if (!userId || isReview) return;
    try {
      await supabase.from("user_progress").upsert({
        user_id: userId, category_id: categoryId, lesson_id: lessonId,
        completed, completed_at: completed ? new Date().toISOString() : null, score: earnedXp,
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

      if (completed) {
        const { data: existing } = await supabase.from("achievements").select("id").eq("user_id", userId).eq("badge_id", "first-lesson").maybeSingle();
        if (!existing) await supabase.from("achievements").insert({ user_id: userId, badge_id: "first-lesson" });
      }
    } catch (err) {
      console.error("Failed to save progress:", err);
    }
  };

  const handleNext = () => {
    if (soundEnabled) playClickSound();
    setPaceWarning(null);

    // Track reading time for info steps
    const elapsed = (Date.now() - stepStartTime.current) / 1000;
    if (step?.type === "info" && step.content) {
      infoReadTimes.current.push({ duration: elapsed, contentLength: step.content.length });

      // Check if Pebble should intervene about reading pace
      const recentCorrect = recentQuizResults.current.slice(-3);
      const recentAccuracy = recentCorrect.length > 0 ? recentCorrect.filter(Boolean).length / recentCorrect.length : 1;
      const warning = getReadingPaceIntervention(elapsed, step.content.length, recentAccuracy);
      if (warning) {
        setPaceWarning(warning);
        // Don't block, just show warning briefly
      }
    }

    stepStartTime.current = Date.now();

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setOrderedItems([]);
      setDragSubmitted(false);
      setFeedbackMascotMsg(null);
    } else {
      if (!isReview) {
        saveLessonProgress(totalXp);
        adaptUserLearningCode();
      }
      setShowConfetti(true);
      if (soundEnabled) playSuccessSound();
      setShowCompletion(true);
    }
  };

  /** After lesson completion, adapt the learning code based on observed behavior */
  const adaptUserLearningCode = async () => {
    if (!userId) return;
    try {
      const { data: profile } = await supabase.from("profiles").select("learning_code").eq("user_id", userId).single();
      const currentCode = (profile as any)?.learning_code || "111111111";
      const reads = infoReadTimes.current;
      const avgReadTime = reads.length > 0 ? reads.reduce((s, r) => s + r.duration, 0) / reads.length : 15;
      const avgContentLen = reads.length > 0 ? reads.reduce((s, r) => s + r.contentLength, 0) / reads.length : 200;
      const accuracy = totalQuizzes > 0 ? correctAnswers / totalQuizzes : 1;

      const newCode = adaptLearningCode(currentCode, {
        avgReadingTimeSec: avgReadTime,
        accuracy,
        totalQuizzes,
        infoStepsCount: reads.length,
        avgContentLength: avgContentLen,
      });

      if (newCode !== currentCode) {
        await supabase.from("profiles").update({ learning_code: newCode } as any).eq("user_id", userId);
      }
    } catch (err) {
      console.error("Failed to adapt learning code:", err);
    }
  };

  const canProceed = step.type === "info" || (step.type === "quiz" && showFeedback) || (step.type === "drag" && dragSubmitted);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Confetti active={showConfetti} />
      <XpPopup amount={xpAmount} show={showXp} />

      <AnimatePresence>
        {showLifeLostAnim && (
          <motion.div
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: 0, y: -50, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[90]"
          >
            <Heart className="w-10 h-10 text-destructive" fill="currentColor" />
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div className="progress-fill h-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
          </div>
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map(i => (
              <Heart key={i} className={`w-4 h-4 transition-all duration-300 ${i < lives ? "text-destructive" : "text-muted-foreground/20"}`} fill="currentColor" />
            ))}
          </div>
          {isReview && <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">Review</span>}
          <span className="text-sm font-medium text-accent xp-counter">{isReview ? "—" : `${totalXp} XP`}</span>
          <span className="text-sm text-muted-foreground xp-counter">{currentStep + 1}/{steps.length}</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-6 w-full">
        <motion.div key={`mascot-${currentStep}-${feedbackMascotMsg}-${paceWarning}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
          <Mascot
            message={paceWarning || feedbackMascotMsg || (tStep?.mascotMsg ?? step.mascotMsg)}
            size="sm"
            animation={paceWarning ? "bounce" : feedbackMascotMsg ? (feedbackMascotMsg.includes("Nailed") || feedbackMascotMsg.includes("Brilliant") || feedbackMascotMsg.includes("fire") || feedbackMascotMsg.includes("Perfect") ? "celebrate" : "bounce") : "idle"}
          />
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <h2 className="text-2xl font-semibold text-foreground mb-6">{tStep?.title ?? step.title}</h2>

            {step.type === "info" && (
              <div className="lesson-card">
                {step.image && <img src={step.image} alt={`Illustration for ${tStep?.title ?? step.title}`} className="w-full h-48 object-cover rounded-lg mb-4" />}
                {step.video && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden mb-4 bg-muted">
                    <iframe src={step.video} title={tStep?.title ?? step.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <p className="text-foreground leading-relaxed text-lg flex-1">{tStep?.content ?? step.content}</p>
                  {(tStep?.content ?? step.content) && <ReadAloudButton text={tStep?.content ?? step.content ?? ""} size="sm" className="shrink-0 mt-1" />}
                </div>
              </div>
            )}

            {step.type === "quiz" && shuffledQuiz && (
              <div>
                <div className="flex items-start gap-2 mb-6">
                  <p className="text-foreground text-lg flex-1">{tStep?.question ?? step.question}</p>
                  {(tStep?.question ?? step.question) && <ReadAloudButton text={tStep?.question ?? step.question ?? ""} size="sm" className="shrink-0 mt-1" />}
                </div>
                <div className="space-y-3">
                  {shuffledQuiz.originalIndices.map((origIdx, idx) => {
                    const opt = (tStep?.options ?? step.options)?.[origIdx] ?? "";
                    let borderClass = "";
                    if (showFeedback && idx === shuffledQuiz.correctIndex) borderClass = "border-primary bg-primary/5";
                    else if (showFeedback && idx === selectedAnswer && idx !== shuffledQuiz.correctIndex) borderClass = "border-destructive bg-destructive/5";
                    return (
                      <motion.button key={idx} whileTap={{ scale: 0.98 }} onClick={() => handleAnswer(idx)} disabled={showFeedback}
                        className={`lesson-card w-full text-left flex items-center gap-3 min-h-[44px] ${borderClass} ${!showFeedback && selectedAnswer === idx ? "border-primary" : ""}`}>
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-sm font-medium text-foreground">{String.fromCharCode(65 + idx)}</div>
                        <span className="text-foreground">{opt}</span>
                        {showFeedback && idx === shuffledQuiz.correctIndex && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                        {showFeedback && idx === selectedAnswer && idx !== shuffledQuiz.correctIndex && <XCircle className="w-5 h-5 text-destructive ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
                {showFeedback && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`mt-4 p-4 rounded-lg border-2 ${selectedAnswer === shuffledQuiz.correctIndex ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}>
                    <p className="text-sm font-medium text-foreground mb-1">{selectedAnswer === shuffledQuiz.correctIndex ? t("lesson.correct_label") : t("lesson.not_quite")}</p>
                    <p className="text-sm text-muted-foreground">{tStep?.explanation ?? step.explanation}</p>
                  </motion.div>
                )}
              </div>
            )}

            {step.type === "drag" && (
              <div>
                <p className="text-foreground text-lg mb-6">{tStep?.instruction ?? step.instruction}</p>
                <div className="space-y-2 mb-6">
                  {orderedItems.map((id, idx) => {
                    const item = (tStep?.items ?? step.items)?.find(i => i.id === id);
                    if (!item) return null;
                    const origItem = step.items?.find(i => i.id === id);
                    const isCorrect = dragSubmitted && origItem && origItem.order === idx + 1;
                    const isWrong = dragSubmitted && origItem && origItem.order !== idx + 1;
                    return (
                      <motion.div key={id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className={`lesson-card flex items-center gap-3 py-3 min-h-[44px] ${isCorrect ? "border-primary" : isWrong ? "border-destructive" : ""}`}>
                        <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">{idx + 1}</span>
                        <span className="text-foreground">{item.text}</span>
                        {!dragSubmitted && <button onClick={() => handleOrderItem(id)} className="ml-auto text-muted-foreground hover:text-destructive text-xs min-h-[44px] min-w-[44px] flex items-center justify-center">{t("lesson.remove")}</button>}
                        {dragSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-primary ml-auto" />}
                        {dragSubmitted && isWrong && <XCircle className="w-4 h-4 text-destructive ml-auto" />}
                      </motion.div>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {shuffledItems.filter(i => !orderedItems.includes(i.id)).map(item => {
                    const tItem = (tStep?.items ?? step.items)?.find(i => i.id === item.id);
                    return (
                      <motion.button key={item.id} whileTap={{ scale: 0.98 }} onClick={() => handleOrderItem(item.id)}
                        className="w-full p-4 border-2 border-dashed border-border rounded-lg text-left text-foreground hover:border-primary transition-colors min-h-[44px]">
                        {tItem?.text ?? item.text}
                      </motion.button>
                    );
                  })}
                </div>
                {orderedItems.length === (step.items?.length || 0) && !dragSubmitted && (
                  <Button className="mt-4 min-h-[44px]" onClick={handleSubmitOrder}>{t("lesson.check_order")}</Button>
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

        {/* PebbleTip - contextual penguin helper */}
        <PebbleTip
          learningCode={userLearningCode}
          stepType={step.type as "info" | "quiz" | "drag"}
          question={step.question}
          recentAccuracy={totalQuizzes > 0 ? correctAnswers / totalQuizzes : 1}
          options={step.options}
          correctIndex={shuffledQuiz?.correctIndex}
          content={step.content}
        />
      </main>

      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button onClick={handleNext} disabled={!canProceed} className="w-full gap-2 min-h-[44px]" size="lg">
            {currentStep === steps.length - 1 ? t("lesson.complete").replace(" 🎉", "") : t("onboarding.continue")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
