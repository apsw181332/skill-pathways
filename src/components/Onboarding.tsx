import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Eye, Ear, Hand, BookOpen, MapPin, ChevronDown, ChevronUp } from "lucide-react";
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

// Scenario-based VARK assessment questions
const VARK_SCENARIOS = [
  {
    scenario: "You need to learn a new recipe. How would you prefer to learn it?",
    options: [
      { style: "visual", label: "Watch a video of someone cooking it", icon: "🎬" },
      { style: "auditory", label: "Listen to a podcast episode about it", icon: "🎧" },
      { style: "reading", label: "Read the recipe instructions step by step", icon: "📖" },
      { style: "kinesthetic", label: "Get in the kitchen and try it hands-on", icon: "👐" },
    ],
  },
  {
    scenario: "You're studying for an important exam. What's your go-to strategy?",
    options: [
      { style: "visual", label: "Draw diagrams, charts, and mind maps", icon: "🗺️" },
      { style: "auditory", label: "Record yourself reading notes and listen back", icon: "🎙️" },
      { style: "reading", label: "Rewrite and summarize your notes in detail", icon: "✍️" },
      { style: "kinesthetic", label: "Walk around while reviewing or use flashcards", icon: "🚶" },
    ],
  },
  {
    scenario: "You're assembling new furniture. What do you do first?",
    options: [
      { style: "visual", label: "Look at the diagrams and pictures in the manual", icon: "📐" },
      { style: "auditory", label: "Call someone and have them talk you through it", icon: "📞" },
      { style: "reading", label: "Read the written instructions carefully", icon: "📝" },
      { style: "kinesthetic", label: "Start putting pieces together and figure it out", icon: "🔧" },
    ],
  },
  {
    scenario: "You want to learn about a new country. How do you start?",
    options: [
      { style: "visual", label: "Watch documentaries and look at photos", icon: "🎥" },
      { style: "auditory", label: "Listen to travel podcasts or local music", icon: "🎶" },
      { style: "reading", label: "Read travel guides and articles", icon: "📚" },
      { style: "kinesthetic", label: "Cook their food and practice basic phrases", icon: "🌍" },
    ],
  },
];

const LEARNING_STYLES = [
  { id: "visual", label: "Visual", icon: Eye, desc: "You learn best by seeing diagrams, videos, and charts", emoji: "👁️" },
  { id: "auditory", label: "Auditory", icon: Ear, desc: "You learn best by listening and discussing", emoji: "🎧" },
  { id: "reading", label: "Reading/Writing", icon: BookOpen, desc: "You learn best by reading and writing notes", emoji: "📖" },
  { id: "kinesthetic", label: "Kinesthetic", icon: Hand, desc: "You learn best by doing and practicing", emoji: "👐" },
];

const MASCOT_MESSAGES = [
  "Pick what excites you! 🎯 We'll build your path together.",
  "Let's figure out how you learn best! Answer these scenarios — no wrong answers! 🧠",
  "We want to make sure everything is comfortable for you! Select all that apply — or skip if none. 🌈",
  "Tell us where you're from! 🌍 We love our global community.",
  "Here's your learning profile! We've tailored Pathways just for you. 🎉",
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
  // VARK scenario answers
  const [varkAnswers, setVarkAnswers] = useState<string[]>([]);
  const [currentScenario, setCurrentScenario] = useState(0);
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

  const totalSteps = 5; // interests, VARK scenarios, accessibility, location, profile summary
  
  // Determine VARK result from answers
  const getVarkResult = (): string => {
    const counts: Record<string, number> = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 };
    varkAnswers.forEach(a => { if (counts[a] !== undefined) counts[a]++; });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  };

  const getVarkProfile = () => {
    const counts: Record<string, number> = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 };
    varkAnswers.forEach(a => { if (counts[a] !== undefined) counts[a]++; });
    return counts;
  };

  const canProceed = step === 0 ? interests.length > 0 
    : step === 1 ? varkAnswers.length >= VARK_SCENARIOS.length 
    : step === 2 ? true 
    : step === 3 ? !!country 
    : true;

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).slice(0, 8)
    : COUNTRIES.slice(0, 8);

  const COMMON_IDS = ["dyslexia", "colorblind", "adhd", "low-vision", "hearing", "motor", "autism", "epilepsy"];
  const commonModes = ACCESSIBILITY_MODES.filter(m => COMMON_IDS.includes(m.id));
  const extraModes = ACCESSIBILITY_MODES.filter(m => !COMMON_IDS.includes(m.id));
  const visibleModes = showAllAccessibility ? ACCESSIBILITY_MODES : commonModes;

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      const learningStyle = getVarkResult();
      const accessibilityModes: string[] = [];
      disabilities.forEach(d => {
        const opt = ACCESSIBILITY_MODES.find(o => o.id === d);
        if (opt?.cssClass) accessibilityModes.push(opt.id);
      });
      onComplete({ interests, learningStyle, accessibility: disabilities, accessibilityModes, country, city });
    }
  };

  const handleVarkAnswer = (style: string) => {
    const updated = [...varkAnswers];
    updated[currentScenario] = style;
    setVarkAnswers(updated);
    // Auto-advance to next scenario
    if (currentScenario < VARK_SCENARIOS.length - 1) {
      setTimeout(() => setCurrentScenario(currentScenario + 1), 300);
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
        {/* Step 0: Interests */}
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

        {/* Step 1: VARK Scenario-Based Assessment */}
        {step === 1 && (
          <motion.div key="vark" variants={stepVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="w-full max-w-lg">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">How do you learn best?</h1>
            <p className="text-muted-foreground mb-2">Answer {VARK_SCENARIOS.length} quick scenarios — we'll figure out your style!</p>
            
            {/* Scenario progress dots */}
            <div className="flex gap-2 mb-6">
              {VARK_SCENARIOS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentScenario(i)}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    i === currentScenario
                      ? "bg-primary text-primary-foreground scale-110"
                      : varkAnswers[i]
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentScenario}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="lesson-card mb-4 border-primary/30">
                  <p className="text-foreground font-medium text-lg">{VARK_SCENARIOS[currentScenario].scenario}</p>
                </div>
                <div className="space-y-3">
                  {VARK_SCENARIOS[currentScenario].options.map((opt) => (
                    <button
                      key={opt.style}
                      onClick={() => handleVarkAnswer(opt.style)}
                      className={`lesson-card w-full text-left flex items-center gap-4 transition-all ${
                        varkAnswers[currentScenario] === opt.style ? "border-primary shadow-md bg-primary/5" : ""
                      }`}
                      aria-pressed={varkAnswers[currentScenario] === opt.style}
                    >
                      <span className="text-2xl shrink-0">{opt.icon}</span>
                      <span className="text-foreground">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Step 2: Accessibility */}
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

        {/* Step 3: Location */}
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

        {/* Step 4: Profile Summary */}
        {step === 4 && (
          <motion.div key="summary" variants={stepVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }} className="w-full max-w-lg">
            <h1 className="text-3xl md:text-4xl font-semibold mb-2 text-foreground">Your Learning Profile</h1>
            <p className="text-muted-foreground mb-6">
              Based on your answers, here's how we've personalized Pathways for you. You can adjust these anytime in Settings.
            </p>

            {/* VARK result */}
            <div className="lesson-card mb-4 border-primary/30">
              <h3 className="font-semibold text-foreground mb-3">🧠 Your Learning Style</h3>
              {(() => {
                const result = getVarkResult();
                const style = LEARNING_STYLES.find(s => s.id === result);
                const profile = getVarkProfile();
                const total = varkAnswers.length || 1;
                return (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{style?.emoji}</span>
                      <div>
                        <span className="text-lg font-bold text-primary">{style?.label} Learner</span>
                        <p className="text-sm text-muted-foreground">{style?.desc}</p>
                      </div>
                    </div>
                    {/* VARK bar chart */}
                    <div className="space-y-2">
                      {LEARNING_STYLES.map(s => {
                        const count = profile[s.id] || 0;
                        const pct = Math.round((count / total) * 100);
                        return (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="text-sm w-24 text-muted-foreground">{s.emoji} {s.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                              />
                            </div>
                            <span className="text-xs font-medium text-foreground w-8 text-right">{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Interests */}
            <div className="lesson-card mb-4">
              <h3 className="font-semibold text-foreground mb-2">🎯 Your Interests</h3>
              <div className="flex flex-wrap gap-2">
                {interests.map(id => {
                  const interest = INTERESTS.find(i => i.id === id);
                  return interest ? (
                    <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">
                      {interest.icon} {interest.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Accessibility */}
            {disabilities.length > 0 && disabilities[0] !== "none" && (
              <div className="lesson-card mb-4">
                <h3 className="font-semibold text-foreground mb-2">♿ Accessibility</h3>
                <p className="text-sm text-muted-foreground">
                  We've configured {disabilities.length} accessibility adaptation{disabilities.length > 1 ? "s" : ""} for you. The interface will automatically adjust.
                </p>
              </div>
            )}

            {/* Location */}
            {country && (
              <div className="lesson-card mb-4">
                <h3 className="font-semibold text-foreground mb-1">🌍 Location</h3>
                <p className="text-sm text-muted-foreground">{city ? `${city}, ${country}` : country}</p>
              </div>
            )}

            <p className="text-sm text-muted-foreground text-center mt-4">
              We'll prioritize content that matches your {getVarkResult()} learning style and serve lessons tailored to your profile.
            </p>
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
