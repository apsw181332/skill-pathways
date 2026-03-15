import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonViewProps {
  onBack: () => void;
}

const STEPS = [
  {
    type: "info" as const,
    title: "What is an emergency fund?",
    content:
      "An emergency fund is money set aside for unplanned expenses — a car repair, medical bill, or sudden job loss. It's the foundation of financial stability.",
  },
  {
    type: "quiz" as const,
    title: "Quick check",
    question: "How many months of expenses should an emergency fund ideally cover?",
    options: ["1 month", "3–6 months", "12 months", "It doesn't matter"],
    correct: 1,
    explanation:
      "Most financial experts recommend 3–6 months of living expenses. This gives you enough runway to handle most unexpected situations without going into debt.",
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
  },
  {
    type: "info" as const,
    title: "Where to keep it",
    content:
      "Keep your emergency fund in a high-yield savings account — separate from your checking account. This keeps it accessible but not too easy to spend. Look for accounts with 4%+ APY and no monthly fees.",
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
  },
];

const LessonView = ({ onBack }: LessonViewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [dragSubmitted, setDragSubmitted] = useState(false);

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleAnswer = (idx: number) => {
    if (showFeedback) return;
    setSelectedAnswer(idx);
    setShowFeedback(true);
  };

  const handleOrderItem = (id: string) => {
    if (dragSubmitted) return;
    if (orderedItems.includes(id)) {
      setOrderedItems(orderedItems.filter((i) => i !== id));
    } else {
      setOrderedItems([...orderedItems, id]);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setOrderedItems([]);
      setDragSubmitted(false);
    } else {
      onBack();
    }
  };

  const canProceed =
    step.type === "info" ||
    (step.type === "quiz" && showFeedback) ||
    (step.type === "drag" && dragSubmitted);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <span className="text-sm text-muted-foreground xp-counter">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto px-6 py-8 w-full">
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

                {/* Ordered slots */}
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
                      </motion.div>
                    );
                  })}
                </div>

                {/* Available items */}
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
                  <Button className="mt-4" onClick={() => setDragSubmitted(true)}>
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

      {/* Bottom action */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleNext}
            disabled={!canProceed}
            className="w-full gap-2"
            size="lg"
          >
            {currentStep === STEPS.length - 1 ? "Complete lesson" : "Continue"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonView;
