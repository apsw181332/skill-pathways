import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, Ear, Hand, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Mascot from "@/components/Mascot";
import { COUNTRIES } from "@/lib/countries";
import { ACCESSIBILITY_MODES } from "@/lib/accessibility";

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

const MASCOT_MESSAGES = [
  "Pick what excites you! 🎯 We'll build your path together.",
  "Everyone learns differently — no wrong answers here! 🧠",
  "We want to make sure everything is comfortable for you! Select all that apply — or skip if none. 🌈",
  "Tell us where you're from! 🌍 We love our global community.",
];

interface OnboardingProps {
  onComplete: (config: UserConfig) => void;
}

export interface UserConfig {
  interests: string[];
  learningStyle: string;
  accessibility: string[];
  accessibilityModes: string[];
  country?: string;
  city?: string;
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
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [showAllAccessibility, setShowAllAccessibility] = useState(false);

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

  const totalSteps = 4;
  const canProceed = step === 0 ? interests.length > 0 : step === 1 ? !!learningStyle : step === 2 ? true : !!country;

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 8)
    : COUNTRIES.slice(0, 8);

  // Show first 6 accessibility options initially, rest behind "Show more"
  const COMMON_IDS = ["dyslexia", "colorblind", "adhd", "low-vision", "hearing", "motor", "autism", "epilepsy"];
  const commonModes = ACCESSIBILITY_MODES.filter(m => COMMON_IDS.includes(m.id));
  const extraModes = ACCESSIBILITY_MODES.filter(m => !COMMON_IDS.includes(m.id));
  const visibleModes = showAllAccessibility ? ACCESSIBILITY_MODES : commonModes;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      const accessibilityModes: string[] = [];
      disabilities.forEach(d => {
        const opt = ACCESSIBILITY_MODES.find(o => o.id === d);
        if (opt?.cssClass) accessibilityModes.push(opt.id);
      });
      onComplete({ interests, learningStyle, accessibility: disabilities, accessibilityModes, country, city });
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
          <motion.div key="interests" variants={stepVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="w-full max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">What do you want to master?</h1>
            <p className="text-muted-foreground mb-8">Pick at least one skill area. You can always change this later.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTERESTS.map((item) => (
                <button key={item.id} onClick={() => toggleInterest(item.id)}
                  className={`lesson-card text-left flex items-start gap-4 ${interests.includes(item.id) ? "border-primary shadow-md" : ""}`}
                  aria-pressed={interests.includes(item.id)}>
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
          <motion.div key="learning" variants={stepVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="w-full max-w-lg">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">How do you learn best?</h1>
            <p className="text-muted-foreground mb-8">We'll tailor your experience accordingly.</p>
            <div className="space-y-3">
              {LEARNING_STYLES.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setLearningStyle(item.id)}
                    className={`lesson-card w-full text-left flex items-center gap-4 ${learningStyle === item.id ? "border-primary shadow-md" : ""}`}
                    aria-pressed={learningStyle === item.id}>
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
          <motion.div key="disabilities" variants={stepVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="w-full max-w-lg">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">Do you have any accessibility needs?</h1>
            <p className="text-muted-foreground mb-4">
              We support 18+ accessibility adaptations. The website will automatically adjust for you. You can always change this in Settings.
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {visibleModes.map((item) => {
                const isSelected = disabilities.includes(item.id);
                return (
                  <button key={item.id} onClick={() => toggleDisability(item.id)}
                    className={`lesson-card w-full text-left flex items-center gap-3 py-3 px-4 ${isSelected ? "border-primary shadow-md" : ""}`}
                    aria-pressed={isSelected}>
                    <span className="text-xl shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm">{item.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {extraModes.length > 0 && (
              <button
                onClick={() => setShowAllAccessibility(!showAllAccessibility)}
                className="mt-3 text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                {showAllAccessibility ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAllAccessibility ? "Show fewer options" : `Show ${extraModes.length} more options`}
              </button>
            )}
            <button onClick={() => { setDisabilities([]); }}
              className={`mt-3 lesson-card w-full text-left flex items-center gap-3 py-3 px-4 ${disabilities.length === 0 ? "border-primary shadow-md" : ""}`}>
              <span className="text-xl">✅</span>
              <div>
                <span className="font-medium text-foreground text-sm">None / Skip</span>
                <p className="text-xs text-muted-foreground">I don't need any adjustments right now.</p>
              </div>
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="location" variants={stepVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="w-full max-w-lg">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">Where are you from?</h1>
            <p className="text-muted-foreground mb-6">
              This helps us understand our global community. Country is required — city is optional.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Country <span className="text-destructive">*</span>
                </label>
                <Input
                  value={countrySearch}
                  onChange={e => { setCountrySearch(e.target.value); if (country && !COUNTRIES.some(c => c.name === e.target.value)) setCountry(""); }}
                  placeholder="Search for your country..."
                  className="mb-2"
                />
                <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button
                      key={c.name}
                      onClick={() => { setCountry(c.name); setCountrySearch(c.name); }}
                      className={`text-left px-3 py-2 rounded-xl text-sm transition-all ${
                        country === c.name
                          ? "bg-primary/10 text-primary ring-2 ring-primary font-semibold"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className="col-span-2 text-sm text-muted-foreground py-4 text-center">No countries found. Try a different search.</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">City (optional)</label>
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="e.g. London, Tokyo, New York..."
                />
              </div>
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
        <Button onClick={handleNext} disabled={!canProceed} className="gap-2 px-6" size="lg">
          {step === totalSteps - 1 ? "Start Learning" : "Continue"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
