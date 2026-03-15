import { useState } from "react";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import {
  Home, BookOpen, Trophy, User, Flame, Star,
  ChevronRight, Lock, CheckCircle2, Circle, Medal, Crown, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserConfig } from "@/components/Onboarding";
import Mascot from "@/components/Mascot";
import mascotImg from "@/assets/mascot-penguin.png";

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

const LEADERBOARD = [
  { rank: 1, name: "Alex M.", xp: 2450, streak: 14 },
  { rank: 2, name: "Jordan K.", xp: 2100, streak: 11 },
  { rank: 3, name: "Sam T.", xp: 1890, streak: 9 },
  { rank: 4, name: "You", xp: 340, streak: 3, isUser: true },
  { rank: 5, name: "Riley B.", xp: 310, streak: 2 },
  { rank: 6, name: "Casey W.", xp: 280, streak: 5 },
  { rank: 7, name: "Morgan D.", xp: 210, streak: 1 },
];

const BADGES = [
  { id: "first-lesson", label: "First Steps", emoji: "🐣", desc: "Complete your first lesson", earned: true },
  { id: "streak-3", label: "On Fire", emoji: "🔥", desc: "3-day streak", earned: true },
  { id: "streak-7", label: "Unstoppable", emoji: "⚡", desc: "7-day streak", earned: false },
  { id: "financial-master", label: "Money Wise", emoji: "💰", desc: "Complete Financial Literacy", earned: false },
  { id: "quiz-ace", label: "Quiz Ace", emoji: "🎯", desc: "Get 10 quizzes correct in a row", earned: false },
  { id: "explorer", label: "Explorer", emoji: "🗺️", desc: "Try 3 different categories", earned: false },
];

const GREETING_MESSAGES = [
  "Welcome back! Ready to crush today's lesson? 🔥",
  "You're on a roll! Let's keep that streak alive! 🎯",
  "Great to see you! Your brain will thank you later. 🧠",
  "Hey champ! Let's learn something awesome today! ⭐",
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

  const greetingMsg = GREETING_MESSAGES[Math.floor(Date.now() / 60000) % GREETING_MESSAGES.length];

  const renderHome = () => (
    <>
      {/* Mascot greeting */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="mb-6"
      >
        <Mascot message={greetingMsg} size="sm" animation="wave" />
      </motion.div>

      {/* Streak & XP cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-2 gap-3 mb-6"
      >
        <div className="lesson-card flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground xp-counter">{streak} days</div>
            <div className="text-xs text-muted-foreground">Current streak</div>
          </div>
        </div>
        <div className="lesson-card flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground xp-counter">{xp} XP</div>
            <div className="text-xs text-muted-foreground">Total earned</div>
          </div>
        </div>
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
        <p className="text-xs text-primary mt-2 font-medium">+15 XP per question</p>
      </motion.button>
    </>
  );

  const renderLearn = () => (
    <>
      {!selectedCategory ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Mascot
              message="Pick a path and start learning! Each lesson earns XP. 🎮"
              size="sm"
              animation="bounce"
            />
          </motion.div>

          <h2 className="text-xl font-semibold text-foreground mb-4">All skill paths</h2>
          <div className="space-y-3">
            {filteredCategories.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}
                onClick={() => setSelectedCategory(cat.id)}
                className="lesson-card w-full text-left flex items-center gap-4 group"
              >
                <span className="text-2xl">{cat.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground">{cat.label}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="progress-fill h-full"
                        style={{ width: `${(cat.completed / cat.lessons) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground xp-counter">
                      {cat.completed}/{cat.lessons}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <>
          <button
            onClick={() => setSelectedCategory(null)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center gap-1"
          >
            ← Back to paths
          </button>

          <Mascot
            message="Pick a lesson and let's dive in! Each one earns you XP. 🎮"
            size="sm"
            animation="bounce"
            className="mb-6"
          />

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
                    {lesson.status === "completed" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    {lesson.status === "current" && <Circle className="w-5 h-5 text-primary" />}
                    {lesson.status === "locked" && <Lock className="w-5 h-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-foreground">{lesson.title}</span>
                    <p className="text-sm text-muted-foreground">
                      {lesson.status === "completed" ? "Completed ✓ · +50 XP" : lesson.status === "current" ? "Up next · ~15 XP per question" : "Locked"}
                    </p>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </>
  );

  const renderLeaderboard = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Mascot
          message="Climb the ranks! Every XP counts. Can you reach #1? 🏆"
          size="sm"
          animation="celebrate"
        />
      </motion.div>

      <h2 className="text-xl font-semibold text-foreground mb-4">Global Leaderboard</h2>

      <div className="space-y-3">
        {LEADERBOARD.map((entry, i) => {
          const isTop3 = entry.rank <= 3;
          const rankIcons = [null, Crown, Medal, Award];
          const RankIcon = rankIcons[entry.rank] || null;

          return (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`lesson-card flex items-center gap-4 py-4 ${
                (entry as any).isUser ? "border-primary bg-primary/5" : ""
              } ${isTop3 ? "border-accent/50" : ""}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                entry.rank === 1 ? "bg-accent/20 text-accent-foreground" :
                entry.rank === 2 ? "bg-secondary text-foreground" :
                entry.rank === 3 ? "bg-secondary text-foreground" :
                "bg-secondary text-muted-foreground"
              }`}>
                {RankIcon ? <RankIcon className="w-4 h-4" /> : `#${entry.rank}`}
              </div>
              <div className="flex-1">
                <span className={`font-medium ${(entry as any).isUser ? "text-primary" : "text-foreground"}`}>
                  {entry.name}
                </span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="w-3 h-3" /> {entry.xp} XP
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Flame className="w-3 h-3" /> {entry.streak} days
                  </span>
                </div>
              </div>
              {isTop3 && (
                <span className="text-lg">
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );

  const renderProfile = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Mascot
          message="Look at all you've accomplished! Keep collecting badges! 🏅"
          size="sm"
          animation="idle"
        />
      </motion.div>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="lesson-card text-center mb-6"
      >
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <img src={mascotImg} alt="Profile" className="w-14 h-14 object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Learner</h2>
        <p className="text-sm text-muted-foreground mt-1">Joined recently</p>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground xp-counter">{xp}</div>
            <div className="text-xs text-muted-foreground">Total XP</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground xp-counter">{streak}</div>
            <div className="text-xs text-muted-foreground">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground xp-counter">2</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Badges</h3>
      <div className="grid grid-cols-2 gap-3">
        {BADGES.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={`lesson-card text-center py-4 ${
              !badge.earned ? "opacity-40 grayscale" : ""
            }`}
          >
            <span className="text-3xl">{badge.emoji}</span>
            <p className="font-medium text-foreground text-sm mt-2">{badge.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
            {badge.earned && (
              <span className="inline-block mt-2 text-xs text-primary font-medium">Earned ✓</span>
            )}
          </motion.div>
        ))}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={mascotImg} alt="Pebble" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-lg text-foreground tracking-tight">Pathways</span>
          </div>
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

      <main className="max-w-2xl mx-auto px-6 pt-6">
        {activeTab === "home" && renderHome()}
        {activeTab === "learn" && renderLearn()}
        {activeTab === "leaderboard" && renderLeaderboard()}
        {activeTab === "profile" && renderProfile()}
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
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedCategory(null);
              }}
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
