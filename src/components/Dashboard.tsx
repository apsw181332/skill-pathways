import { useState } from "react";
import { motion } from "framer-motion";
import {
  Home, BookOpen, Trophy, User, Flame, Star,
  ChevronRight, Lock, CheckCircle2, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserConfig } from "@/components/Onboarding";

const CATEGORIES = [
  { id: "financial", label: "Financial Literacy", emoji: "💰", lessons: 8, completed: 2 },
  { id: "home", label: "Home Maintenance", emoji: "🏠", lessons: 6, completed: 0 },
  { id: "cooking", label: "Cooking & Nutrition", emoji: "🍳", lessons: 10, completed: 0 },
  { id: "social", label: "Social Skills", emoji: "🤝", lessons: 5, completed: 0 },
  { id: "career", label: "Career Growth", emoji: "📈", lessons: 7, completed: 0 },
  { id: "health", label: "Health & Wellness", emoji: "🧘", lessons: 9, completed: 0 },
  { id: "legal", label: "Legal Basics", emoji: "⚖️", lessons: 4, completed: 0 },
  { id: "tech", label: "Digital Literacy", emoji: "💻", lessons: 6, completed: 0 },
];

const SAMPLE_LESSONS = [
  { id: 1, title: "Understanding Your Paycheck", status: "completed" as const },
  { id: 2, title: "Building a Budget That Works", status: "completed" as const },
  { id: 3, title: "Emergency Funds 101", status: "current" as const },
  { id: 4, title: "Credit Scores Decoded", status: "locked" as const },
  { id: 5, title: "Intro to Investing", status: "locked" as const },
];

interface DashboardProps {
  config: UserConfig;
  onStartLesson: () => void;
}

const Dashboard = ({ config, onStartLesson }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "leaderboard" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const xp = 340;
  const streak = 3;

  const filteredCategories = CATEGORIES.filter(
    (c) => config.interests.length === 0 || config.interests.includes(c.id)
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <span className="font-semibold text-lg text-foreground tracking-tight">Pathways</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-sm">
              <Flame className="w-4 h-4 text-destructive" />
              <span className="font-medium xp-counter text-foreground">{streak}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="w-4 h-4 text-accent" />
              <span className="font-medium xp-counter text-foreground">{xp} XP</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-8">
        {!selectedCategory ? (
          <>
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
              className="mb-8"
            >
              <h1 className="text-2xl font-semibold text-foreground mb-1">Good to see you 👋</h1>
              <p className="text-muted-foreground">
                You've mastered 14% of Financial Literacy. Keep going!
              </p>
            </motion.div>

            {/* Continue learning card */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.2, 0, 0, 1] }}
              onClick={onStartLesson}
              className="lesson-card w-full text-left mb-8 group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-primary">Continue learning</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Emergency Funds 101</h2>
              <p className="text-sm text-muted-foreground mb-4">Financial Literacy · Lesson 3 of 8</p>
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="progress-fill" style={{ width: "25%" }} />
              </div>
            </motion.button>

            {/* Categories */}
            <h2 className="text-lg font-semibold text-foreground mb-4">Your skill paths</h2>
            <div className="space-y-3">
              {filteredCategories.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + i * 0.05, ease: [0.2, 0, 0, 1] }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="lesson-card w-full text-left flex items-center gap-4 group"
                >
                  <span className="text-2xl">{cat.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{cat.label}</span>
                    <p className="text-sm text-muted-foreground">
                      {cat.completed}/{cat.lessons} lessons
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </>
        ) : (
          /* Lesson list view */
          <>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center gap-1"
            >
              ← Back to paths
            </button>
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              {CATEGORIES.find((c) => c.id === selectedCategory)?.emoji}{" "}
              {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
            </h1>
            <p className="text-muted-foreground mb-8">Complete lessons in order to unlock the next.</p>

            <div className="space-y-3">
              {SAMPLE_LESSONS.map((lesson, i) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}
                >
                  <button
                    onClick={lesson.status === "current" ? onStartLesson : undefined}
                    disabled={lesson.status === "locked"}
                    className={`lesson-card w-full text-left flex items-center gap-4 ${
                      lesson.status === "current" ? "border-primary" : ""
                    } ${lesson.status === "locked" ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="shrink-0">
                      {lesson.status === "completed" && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                      {lesson.status === "current" && (
                        <Circle className="w-5 h-5 text-primary" />
                      )}
                      {lesson.status === "locked" && (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{lesson.title}</span>
                      <p className="text-sm text-muted-foreground">
                        {lesson.status === "completed" ? "Completed ✓" : lesson.status === "current" ? "Up next" : "Locked"}
                      </p>
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Bottom thumb bar */}
      <div className="thumb-bar">
        {[
          { id: "home" as const, icon: Home, label: "Home" },
          { id: "learn" as const, icon: BookOpen, label: "Learn" },
          { id: "leaderboard" as const, icon: Trophy, label: "Rank" },
          { id: "profile" as const, icon: User, label: "Profile" },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
              aria-label={tab.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
