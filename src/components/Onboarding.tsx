import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, Ear, Hand, Accessibility, Type, Contrast, Brain, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";

const INTERESTS = [
  { id: "financial", label: "Financial Literacy", icon: "💰", desc: "Budgeting, investing, taxes" },
  { id: "home", label: "Home Maintenance", icon: "🏠", desc: "Repairs, cleaning, organization" },
  { id: "cooking", label: "Cooking & Nutrition", icon: "🍳", desc: "Meal prep, balanced diets" },
  { id: "social", label: "Social Skills", icon: "🤝", desc: "Networking, conflict resolution" },
  { id: "career", label: "Career Growth", icon: "📈", desc: "Interviews, negotiation, leadership" },
  { id: "health", label: "Health & Wellness", icon: "🧘", desc: "Exercise, mental health, sleep" },
  { id: "legal", label: "Legal Basics", icon: "⚖️", desc: "Contracts, rights, civic duties" },
  { id: "tech", label: "Digital Literacy", icon: "💻", desc: "Privacy, tools, automation" },
];

const LEARNING_STYLES = [
  { id: "visual", label: "Visual", icon: Eye, desc: "I learn best by seeing diagrams and charts" },
  { id: "auditory", label: "Auditory", icon: Ear, desc: "I learn best by listening and discussing" },
  { id: "kinesthetic", label: "Kinesthetic", icon: Hand, desc: "I learn best by doing and practicing" },
];

const DISABILITY_OPTIONS = [
  { id: "dyslexic", label: "Dyslexia", icon: "📖", desc: "I find reading standard fonts difficult. Switch to OpenDyslexic with wider spacing.", mode: "dyslexic" },
  { id: "colorblind", label: "Colour Blindness", icon: "🎨", desc: "I have difficulty distinguishing certain colours. Use patterns and text cues instead.", mode: "colorblind" },
  { id: "adhd", label: "ADHD", icon: "🧠", desc: "I get distracted easily. Reduce animations, simplify layout, larger tap targets.", mode: "adhd" },
  { id: "low-vision", label: "Low Vision", icon: "👁️", desc: "I need high contrast and larger text for comfortable reading.", mode: "high-contrast" },
  { id: "none", label: "None of the above", icon: "✅", desc: "I don't need any special adjustments.", mode: null },
];

const MASCOT_MESSAGES = [
  "Pick what excites you! 🎯 We'll build your path together.",
  "Everyone learns differently — no wrong answers here! 🧠",
  "We want to make sure everything is comfortable for you! 🌈",
  "Almost done! Let's finish setting up. 🎨",
];

interface OnboardingProps {
  onComplete: (config: UserConfig) => void;
}

export interface UserConfig {
  interests: string[];
  learningStyle: string;
  accessibility: string[];
  accessibilityModes: string[];
}

const stepVariants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const Onboarding = ({ onComplete }: OnboardingProps) => {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [learningStyle, setLearningStyle] = useState("");
  const [disabilities, setDisabilities] = useState<string[]>([]);
  const [accessibility, setAccessibility] = useState<string[]>([]);

  const toggleInterest = (id: string) =>
    setInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const toggleDisability = (id: string) => {
    if (id === "none") {
      setDisabilities(["none"]);
      return;
    }
    setDisabilities((prev) => {
      const filtered = prev.filter(d => d !== "none");
      return filtered.includes(id) ? filtered.filter((i) => i !== id) : [...filtered, id];
    });
  };

  const canProceed = step === 0 ? interests.length > 0 : step === 1 ? !!learningStyle : true;
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      // Map disabilities to accessibility modes
      const accessibilityModes: string[] = [];
      disabilities.forEach(d => {
        const opt = DISABILITY_OPTIONS.find(o => o.id === d);
        if (opt?.mode) accessibilityModes.push(opt.mode);
      });
      onComplete({ interests, learningStyle, accessibility, accessibilityModes });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      {/* Progress */}
      <div className="w-full max-w-md mb-6">
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              {i <= step && (
                <motion.div
                  className="progress-fill h-full"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-muted-foreground text-sm mt-3">Step {step + 1} of {totalSteps}</p>
      </div>

      {/* Mascot guide */}
      <motion.div
        key={`mascot-${step}`}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6 w-full max-w-2xl"
      >
        <Mascot
          message={MASCOT_MESSAGES[step]}
          size="sm"
          animation={step === totalSteps - 1 ? "celebrate" : "bounce"}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="interests"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="w-full max-w-2xl"
          >
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">What do you want to master?</h1>
            <p className="text-muted-foreground mb-8">Pick at least one skill area. You can always change this later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERESTS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`lesson-card text-left flex items-start gap-4 ${
                    interests.includes(item.id) ? "border-primary shadow-md" : ""
                  }`}
                  aria-pressed={interests.includes(item.id)}
                >
                  <span className="text-2xl mt-0.5">{item.icon}</span>
                  <div>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="learning"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="w-full max-w-lg"
          >
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">How do you learn best?</h1>
            <p className="text-muted-foreground mb-8">We'll tailor your experience accordingly.</p>
            <div className="space-y-3">
              {LEARNING_STYLES.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setLearningStyle(item.id)}
                    className={`lesson-card w-full text-left flex items-center gap-4 ${
                      learningStyle === item.id ? "border-primary shadow-md" : ""
                    }`}
                    aria-pressed={learningStyle === item.id}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{item.label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="disabilities"
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
            className="w-full max-w-lg"
          >
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">Do you have any accessibility needs?</h1>
            <p className="text-muted-foreground mb-4">
              We want everyone to learn comfortably. Select any that apply — the website will automatically adjust for you. You can always change this in Settings.
            </p>
            <div className="space-y-3">
              {DISABILITY_OPTIONS.map((item) => {
                const isSelected = disabilities.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleDisability(item.id)}
                    className={`lesson-card w-full text-left flex items-center gap-4 ${
                      isSelected ? "border-primary shadow-md" : ""
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-xl">{item.icon}</span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{item.label}</span>
                      <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10 w-full max-w-2xl flex justify-between items-center">
        {step > 0 ? (
          <Button variant="ghost" onClick={() => setStep(step - 1)} className="text-muted-foreground">
            Back
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="gap-2 px-6"
          size="lg"
        >
          {step === totalSteps - 1 ? "Start Learning" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
