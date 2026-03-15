import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Home, BookOpen, Trophy, User as UserIcon, Flame, Star,
  ChevronRight, Lock, CheckCircle2, Circle, Medal, Crown, Award, LogOut,
  Users, UserPlus, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserConfig } from "@/components/Onboarding";
import Mascot from "@/components/Mascot";
import mascotImg from "@/assets/mascot-penguin.png";
import { getLevelForXp, getXpProgress, LEVELS } from "@/lib/levels";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
  { id: "everyday", label: "Everyday Skills", emoji: "👟", lessons: 8 },
  { id: "financial", label: "Money & Taxes", emoji: "💰", lessons: 8 },
  { id: "home", label: "Home & DIY", emoji: "🏠", lessons: 6 },
  { id: "cooking", label: "Cooking & Nutrition", emoji: "🍳", lessons: 10 },
  { id: "social", label: "People Skills", emoji: "🤝", lessons: 5 },
  { id: "career", label: "Career & Work", emoji: "📈", lessons: 7 },
  { id: "health", label: "Health & Wellness", emoji: "🧘", lessons: 9 },
  { id: "tech", label: "Digital Literacy", emoji: "💻", lessons: 6 },
];

const BADGE_DEFINITIONS = [
  { id: "first-lesson", label: "First Steps", emoji: "🐣", desc: "Complete your first lesson" },
  { id: "streak-3", label: "On Fire", emoji: "🔥", desc: "3-day streak" },
  { id: "streak-7", label: "Unstoppable", emoji: "⚡", desc: "7-day streak" },
  { id: "financial-master", label: "Money Wise", emoji: "💰", desc: "Complete Financial Literacy" },
  { id: "quiz-ace", label: "Quiz Ace", emoji: "🎯", desc: "Get 10 quizzes correct in a row" },
  { id: "explorer", label: "Explorer", emoji: "🗺️", desc: "Try 3 different categories" },
  { id: "social-butterfly", label: "Social Butterfly", emoji: "🦋", desc: "Add 5 friends" },
  { id: "level-5", label: "Advanced", emoji: "🔥", desc: "Reach Level 5" },
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
  user: SupabaseUser;
  onSignOut: () => Promise<void>;
}

interface FriendData {
  id: string;
  user_id: string;
  friend_id: string;
  status: string;
}

interface ProfileData {
  id: string;
  user_id: string;
  display_name: string | null;
  xp: number;
  streak: number;
  level: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  userId: string;
  isUser: boolean;
}

const Dashboard = ({ config, onStartLesson, user, onSignOut }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "leaderboard" | "friends" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendData[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, ProfileData>>({});
  const [pendingProfiles, setPendingProfiles] = useState<Record<string, ProfileData>>({});

  // Real user data from DB
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentLesson, setCurrentLesson] = useState<{ categoryId: string; lessonId: number; title: string } | null>(null);

  const levelInfo = getXpProgress(xp);

  const filteredCategories = CATEGORIES.filter(
    (c) => config.interests.length === 0 || config.interests.includes(c.id)
  );

  const greetingMsg = GREETING_MESSAGES[Math.floor(Date.now() / 60000) % GREETING_MESSAGES.length];

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("xp, streak")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setXp(data.xp);
        setStreak(data.streak);
      }
    };

    const fetchAchievements = async () => {
      const { data } = await supabase
        .from("achievements")
        .select("badge_id")
        .eq("user_id", user.id);
      if (data) setEarnedBadges(data.map((a) => a.badge_id));
    };

    const fetchProgress = async () => {
      const { data } = await supabase
        .from("user_progress")
        .select("category_id, lesson_id, completed")
        .eq("user_id", user.id);
      if (data) {
        const progress: Record<string, number> = {};
        let nextLesson: { categoryId: string; lessonId: number; title: string } | null = null;
        data.forEach((p) => {
          if (p.completed) {
            progress[p.category_id] = (progress[p.category_id] || 0) + 1;
          }
        });
        setCategoryProgress(progress);

        // Find the next uncompleted lesson
        for (const cat of CATEGORIES) {
          const completed = progress[cat.id] || 0;
          if (completed < cat.lessons) {
            nextLesson = { categoryId: cat.id, lessonId: completed + 1, title: `${cat.label} · Lesson ${completed + 1}` };
            break;
          }
        }
        setCurrentLesson(nextLesson);
      }
    };

    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp, streak")
        .order("xp", { ascending: false })
        .limit(50);
      if (data) {
        const entries: LeaderboardEntry[] = data.map((p, i) => ({
          rank: i + 1,
          name: p.display_name || "Anonymous",
          xp: p.xp,
          streak: p.streak,
          userId: p.user_id,
          isUser: p.user_id === user.id,
        }));
        setLeaderboard(entries);
      }
    };

    fetchProfile();
    fetchAchievements();
    fetchProgress();
    fetchLeaderboard();
  }, [user.id]);

  // Realtime subscription for profile changes
  useEffect(() => {
    const channel = supabase
      .channel("my-profile")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const p = payload.new as any;
        setXp(p.xp);
        setStreak(p.streak);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  // Fetch friends with display names
  useEffect(() => {
    const fetchFriends = async () => {
      const { data: sent } = await supabase
        .from("friendships")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "accepted");

      const { data: received } = await supabase
        .from("friendships")
        .select("*")
        .eq("friend_id", user.id)
        .eq("status", "accepted");

      const { data: pending } = await supabase
        .from("friendships")
        .select("*")
        .eq("friend_id", user.id)
        .eq("status", "pending");

      const allFriends = [...(sent || []), ...(received || [])];
      setFriends(allFriends);
      setPendingRequests(pending || []);

      // Get profile display names for friends
      const friendUserIds = allFriends.map((f) =>
        f.user_id === user.id ? f.friend_id : f.user_id
      );
      if (friendUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, xp, streak, level, id")
          .in("user_id", friendUserIds);
        if (profiles) {
          const map: Record<string, ProfileData> = {};
          profiles.forEach((p) => { map[p.user_id] = p; });
          setFriendProfiles(map);
        }
      }

      // Get names for pending requests
      const pendingUserIds = (pending || []).map((p) => p.user_id);
      if (pendingUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, xp, streak, level, id")
          .in("user_id", pendingUserIds);
        if (profiles) {
          const map: Record<string, ProfileData> = {};
          profiles.forEach((p) => { map[p.user_id] = p; });
          setPendingProfiles(map);
        }
      }
    };
    fetchFriends();
  }, [user.id]);

  const handleAcceptFriend = async (requestId: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const handleRejectFriend = async (requestId: string) => {
    await supabase.from("friendships").update({ status: "rejected" }).eq("id", requestId);
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const renderHome = () => (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
        className="mb-6"
      >
        <Mascot message={greetingMsg} size="sm" animation="wave" />
      </motion.div>

      {/* Level progress */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.03 }}
        className="lesson-card mb-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{levelInfo.current.emoji}</span>
            <div>
              <span className="font-semibold text-foreground">Level {levelInfo.current.level}</span>
              <span className="text-sm text-muted-foreground ml-2">{levelInfo.current.name}</span>
            </div>
          </div>
          {levelInfo.next && (
            <span className="text-xs text-muted-foreground">
              {xp}/{levelInfo.next.minXp} XP to Lv.{levelInfo.next.level}
            </span>
          )}
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="progress-fill h-full"
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.progress}%` }}
            transition={{ duration: 0.8, ease: [0.2, 0, 0, 1] }}
          />
        </div>
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
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {currentLesson?.title || "Start your first lesson!"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {currentLesson
            ? `${CATEGORIES.find(c => c.id === currentLesson.categoryId)?.emoji} ${currentLesson.title}`
            : "Pick a category and begin learning"}
        </p>
        <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className="progress-fill" style={{ width: currentLesson ? "25%" : "0%" }} />
        </div>
        <p className="text-xs text-primary mt-2 font-medium">+15 XP per question</p>
      </motion.button>
    </>
  );

  const renderLearn = () => (
    <>
      {!selectedCategory ? (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Mascot message="Pick a path and start learning! Each lesson earns XP. 🎮" size="sm" animation="bounce" />
          </motion.div>
          <h2 className="text-xl font-semibold text-foreground mb-4">All skill paths</h2>
          <div className="space-y-3">
            {filteredCategories.map((cat, i) => {
              const completed = categoryProgress[cat.id] || 0;
              return (
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
                        <div className="progress-fill h-full" style={{ width: `${(completed / cat.lessons) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground xp-counter">{completed}/{cat.lessons}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setSelectedCategory(null)} className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 flex items-center gap-1">← Back to paths</button>
          <Mascot message="Pick a lesson and let's dive in! Each one earns you XP. 🎮" size="sm" animation="bounce" className="mb-6" />
          {(() => {
            const cat = CATEGORIES.find((c) => c.id === selectedCategory);
            const completed = categoryProgress[selectedCategory] || 0;
            if (!cat) return null;
            const lessons = Array.from({ length: cat.lessons }, (_, i) => ({
              id: i + 1,
              title: `${cat.label} · Lesson ${i + 1}`,
              status: i < completed ? "completed" as const : i === completed ? "current" as const : "locked" as const,
            }));
            return (
              <>
                <h1 className="text-2xl font-semibold text-foreground mb-2">
                  {cat.emoji} {cat.label}
                </h1>
                <p className="text-muted-foreground mb-8">Complete lessons in order to unlock the next.</p>
                <div className="space-y-3">
                  {lessons.map((lesson, i) => (
                    <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05, ease: [0.2, 0, 0, 1] }}>
                      <button
                        onClick={lesson.status === "current" ? onStartLesson : undefined}
                        disabled={lesson.status === "locked"}
                        className={`lesson-card w-full text-left flex items-center gap-4 ${lesson.status === "current" ? "border-primary" : ""} ${lesson.status === "locked" ? "opacity-50 cursor-not-allowed" : ""}`}
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
            );
          })()}
        </>
      )}
    </>
  );

  const renderLeaderboard = () => (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message="Climb the ranks! Every XP counts. Can you reach #1? 🏆" size="sm" animation="celebrate" />
      </motion.div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Global Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <div className="lesson-card text-center py-8">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No rankings yet</p>
          <p className="text-sm text-muted-foreground">Complete lessons to earn XP and appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, i) => {
            const isTop3 = entry.rank <= 3;
            const rankIcons = [null, Crown, Medal, Award];
            const RankIcon = rankIcons[entry.rank] || null;
            const lvl = getLevelForXp(entry.xp);
            return (
              <motion.div
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className={`lesson-card flex items-center gap-4 py-4 ${entry.isUser ? "border-primary bg-primary/5" : ""} ${isTop3 ? "border-accent/50" : ""}`}
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
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${entry.isUser ? "text-primary" : "text-foreground"}`}>
                      {entry.isUser ? "You" : entry.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{lvl.emoji} Lv.{lvl.level}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> {entry.xp} XP</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> {entry.streak} days</span>
                  </div>
                </div>
                {isTop3 && <span className="text-lg">{entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : "🥉"}</span>}
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );

  const renderFriends = () => (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message="Learning is better with friends! Add people and compete together! 🤝" size="sm" animation="bounce" />
      </motion.div>

      <h2 className="text-xl font-semibold text-foreground mb-4">Friends</h2>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pending Requests ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => {
              const profile = pendingProfiles[req.user_id];
              return (
                <div key={req.id} className="lesson-card flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="flex-1 font-medium text-foreground text-sm">
                    {profile?.display_name || "Anonymous"}
                  </span>
                  <button onClick={() => handleAcceptFriend(req.id)} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleRejectFriend(req.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends list */}
      {friends.length > 0 ? (
        <div className="space-y-3">
          {friends.map((friend) => {
            const friendUserId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
            const profile = friendProfiles[friendUserId];
            const lvl = profile ? getLevelForXp(profile.xp) : null;
            return (
              <div key={friend.id} className="lesson-card flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">
                    {profile?.display_name || "Anonymous"}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lvl && <span className="text-xs text-muted-foreground">{lvl.emoji} Lv.{lvl.level}</span>}
                    {profile && <span className="text-xs text-muted-foreground">{profile.xp} XP</span>}
                    {profile && <span className="text-xs text-muted-foreground">🔥 {profile.streak}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="lesson-card text-center py-8">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No friends yet</p>
          <p className="text-sm text-muted-foreground">Share your invite code to add friends and compete together!</p>
        </div>
      )}

      {/* Invite code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lesson-card mt-6 text-center">
        <UserPlus className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold text-foreground mb-1">Your Invite Code</h3>
        <div className="bg-secondary rounded-lg px-4 py-2 font-mono text-sm text-foreground inline-block">
          {user.id.slice(0, 8).toUpperCase()}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Share this code with friends to connect!</p>
      </motion.div>
    </>
  );

  const renderProfile = () => (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message="Look at all you've accomplished! Keep collecting badges! 🏅" size="sm" animation="idle" />
      </motion.div>

      {/* Profile header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lesson-card text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <img src={mascotImg} alt="Profile" className="w-14 h-14 object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{user.user_metadata?.display_name || user.email?.split("@")[0] || "Learner"}</h2>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>

        {/* Level badge */}
        <div className="inline-flex items-center gap-2 mt-3 bg-secondary rounded-full px-4 py-1.5">
          <span className="text-lg">{levelInfo.current.emoji}</span>
          <span className="font-semibold text-foreground">Level {levelInfo.current.level}</span>
          <span className="text-sm text-muted-foreground">{levelInfo.current.name}</span>
        </div>

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
            <div className="text-lg font-semibold text-foreground xp-counter">{friends.length}</div>
            <div className="text-xs text-muted-foreground">Friends</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-foreground xp-counter">{earnedBadges.length}</div>
            <div className="text-xs text-muted-foreground">Badges</div>
          </div>
        </div>
      </motion.div>

      {/* Level progression */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Level Progression</h3>
      <div className="lesson-card mb-6">
        <div className="space-y-2">
          {LEVELS.map((lvl) => {
            const isReached = xp >= lvl.minXp;
            return (
              <div key={lvl.level} className={`flex items-center gap-3 py-1.5 ${!isReached ? "opacity-40" : ""}`}>
                <span className="text-lg">{lvl.emoji}</span>
                <span className={`text-sm font-medium ${isReached ? "text-foreground" : "text-muted-foreground"}`}>
                  Lv.{lvl.level} {lvl.name}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{lvl.minXp} XP</span>
                {isReached && <CheckCircle2 className="w-4 h-4 text-primary" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Badges</h3>
      <div className="grid grid-cols-2 gap-3">
        {BADGE_DEFINITIONS.map((badge, i) => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className={`lesson-card text-center py-4 ${!earned ? "opacity-40 grayscale" : ""}`}
            >
              <span className="text-3xl">{badge.emoji}</span>
              <p className="font-medium text-foreground text-sm mt-2">{badge.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
              {earned && <span className="inline-block mt-2 text-xs text-primary font-medium">Earned ✓</span>}
            </motion.div>
          );
        })}
      </div>

      <Button variant="ghost" onClick={onSignOut} className="w-full mt-6 text-muted-foreground hover:text-destructive gap-2">
        <LogOut className="w-4 h-4" />
        Sign out
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={mascotImg} alt="Pebble" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-lg text-foreground tracking-tight">Pathways</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs font-medium bg-secondary rounded-full px-2 py-1">
              <span>{levelInfo.current.emoji}</span>
              <span className="text-foreground">Lv.{levelInfo.current.level}</span>
            </div>
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
        {activeTab === "friends" && renderFriends()}
        {activeTab === "profile" && renderProfile()}
      </main>

      <div className="thumb-bar">
        {[
          { id: "home" as const, icon: Home, label: "Home" },
          { id: "learn" as const, icon: BookOpen, label: "Learn" },
          { id: "leaderboard" as const, icon: Trophy, label: "Rank" },
          { id: "friends" as const, icon: Users, label: "Friends" },
          { id: "profile" as const, icon: UserIcon, label: "Profile" },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}
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
