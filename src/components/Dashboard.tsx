import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Home, BookOpen, Trophy, User as UserIcon, Flame, Star,
  ChevronRight, Lock, CheckCircle2, Circle, Medal, Crown, Award, LogOut,
  Users, UserPlus, Check, X, Search, Settings as SettingsIcon, Plus, Minus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserConfig } from "@/components/Onboarding";
import Mascot from "@/components/Mascot";
import mascotImg from "@/assets/mascot-penguin.png";
import { getLevelForXp, getXpProgress, LEVELS } from "@/lib/levels";
import { COURSES } from "@/lib/courseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

function getGreeting(streak: number): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (streak === 0) {
    const msgs = [
      `${timeGreeting}! Ready to start learning something new? 🚀`,
      `${timeGreeting}! Let's build some awesome skills today! 🌟`,
      `${timeGreeting}! Your learning journey begins — let's go! 💪`,
    ];
    return msgs[Math.floor(Date.now() / 60000) % msgs.length];
  }
  if (streak >= 7) {
    return `${timeGreeting}! ${streak}-day streak — you're absolutely unstoppable! 🔥⚡`;
  }
  if (streak >= 3) {
    return `${timeGreeting}! ${streak} days in a row — keep that streak alive! 🔥`;
  }
  return `${timeGreeting}! Day ${streak} — let's keep the momentum going! 🎯`;
}

interface DashboardProps {
  config: UserConfig;
  onStartLesson: (categoryId: string, lessonId: number) => void;
  user: SupabaseUser;
  onSignOut: () => Promise<void>;
  onOpenSettings: () => void;
  enrolledCourses: string[];
  onEnroll: (courseId: string) => Promise<boolean>;
  onUnenroll: (courseId: string) => Promise<void>;
}

interface FriendData { id: string; user_id: string; friend_id: string; status: string; }
interface ProfileData { id: string; user_id: string; display_name: string | null; xp: number; streak: number; level: number; }
interface LeaderboardEntry { rank: number; name: string; xp: number; streak: number; userId: string; isUser: boolean; }

const Dashboard = ({ config, onStartLesson, user, onSignOut, onOpenSettings, enrolledCourses, onEnroll, onUnenroll }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "leaderboard" | "friends" | "profile">("home");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendData[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, ProfileData>>({});
  const [pendingProfiles, setPendingProfiles] = useState<Record<string, ProfileData>>({});
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<string[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const { toast } = useToast();

  const levelInfo = getXpProgress(xp);
  const greetingMsg = getGreeting(streak);

  const filteredCourses = COURSES.filter(c => {
    const matchesSearch = !searchQuery || 
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Fetch data
  useEffect(() => {
    const fetchAll = async () => {
      const [profileRes, achieveRes, progressRes, lbRes] = await Promise.all([
        supabase.from("profiles").select("xp, streak").eq("user_id", user.id).single(),
        supabase.from("achievements").select("badge_id").eq("user_id", user.id),
        supabase.from("user_progress").select("category_id, lesson_id, completed").eq("user_id", user.id),
        supabase.from("profiles").select("user_id, display_name, xp, streak").order("xp", { ascending: false }).limit(50),
      ]);
      if (profileRes.data) { setXp(profileRes.data.xp); setStreak(profileRes.data.streak); }
      if (achieveRes.data) setEarnedBadges(achieveRes.data.map(a => a.badge_id));
      if (progressRes.data) {
        const progress: Record<string, number> = {};
        progressRes.data.forEach(p => { if (p.completed) progress[p.category_id] = (progress[p.category_id] || 0) + 1; });
        setCategoryProgress(progress);
      }
      if (lbRes.data) {
        setLeaderboard(lbRes.data.map((p, i) => ({
          rank: i + 1, name: p.display_name || "Anonymous", xp: p.xp, streak: p.streak, userId: p.user_id, isUser: p.user_id === user.id,
        })));
      }
    };
    fetchAll();
  }, [user.id]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel("my-profile")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => { const p = payload.new as any; setXp(p.xp); setStreak(p.streak); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  // Friends
  useEffect(() => {
    const fetchFriends = async () => {
      const [sent, received, pending] = await Promise.all([
        supabase.from("friendships").select("*").eq("user_id", user.id).eq("status", "accepted"),
        supabase.from("friendships").select("*").eq("friend_id", user.id).eq("status", "accepted"),
        supabase.from("friendships").select("*").eq("friend_id", user.id).eq("status", "pending"),
      ]);
      const allFriends = [...(sent.data || []), ...(received.data || [])];
      setFriends(allFriends);
      setPendingRequests(pending.data || []);

      const friendIds = allFriends.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
      const pendingIds = (pending.data || []).map(p => p.user_id);

      if (friendIds.length > 0) {
        const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level, id").in("user_id", friendIds);
        if (data) { const map: Record<string, ProfileData> = {}; data.forEach(p => map[p.user_id] = p); setFriendProfiles(map); }
      }
      if (pendingIds.length > 0) {
        const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level, id").in("user_id", pendingIds);
        if (data) { const map: Record<string, ProfileData> = {}; data.forEach(p => map[p.user_id] = p); setPendingProfiles(map); }
      }
    };
    fetchFriends();
  }, [user.id]);

  const handleAcceptFriend = async (id: string) => { await supabase.from("friendships").update({ status: "accepted" }).eq("id", id); setPendingRequests(prev => prev.filter(r => r.id !== id)); };
  const handleRejectFriend = async (id: string) => { await supabase.from("friendships").update({ status: "rejected" }).eq("id", id); setPendingRequests(prev => prev.filter(r => r.id !== id)); };

  const handleEnroll = async (courseId: string) => {
    const success = await onEnroll(courseId);
    if (!success) {
      toast({ title: "Course limit reached", description: "You can only study 3 courses at a time. Unenroll from one first.", variant: "destructive" });
    }
  };

  const getNextLesson = () => {
    for (const courseId of enrolledCourses) {
      const course = COURSES.find(c => c.id === courseId);
      if (!course) continue;
      const completed = categoryProgress[courseId] || 0;
      if (completed < course.lessons.length) {
        return { categoryId: courseId, lessonId: completed + 1, title: `${course.label} · Lesson ${completed + 1}`, emoji: course.emoji };
      }
    }
    return null;
  };

  const nextLesson = getNextLesson();

  const renderHome = () => (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message={greetingMsg} size="sm" animation={streak > 0 ? "wave" : "bounce"} />
      </motion.div>

      {/* Level progress */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="lesson-card mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{levelInfo.current.emoji}</span>
            <div>
              <span className="font-semibold text-foreground">Level {levelInfo.current.level}</span>
              <span className="text-sm text-muted-foreground ml-2">{levelInfo.current.name}</span>
            </div>
          </div>
          {levelInfo.next && <span className="text-xs text-muted-foreground">{xp}/{levelInfo.next.minXp} XP</span>}
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div className="progress-fill h-full" initial={{ width: 0 }} animate={{ width: `${levelInfo.progress}%` }} transition={{ duration: 0.8 }} />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3 mb-6">
        <div className="lesson-card flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <div className="text-xl font-semibold text-foreground xp-counter">{streak} days</div>
            <div className="text-xs text-muted-foreground">{streak > 0 ? "Current streak" : "Start a streak!"}</div>
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

      {/* Enrolled courses */}
      {enrolledCourses.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground mb-3">Your Courses ({enrolledCourses.length}/3)</h2>
          <div className="space-y-3 mb-6">
            {enrolledCourses.map(courseId => {
              const course = COURSES.find(c => c.id === courseId);
              if (!course) return null;
              const completed = categoryProgress[courseId] || 0;
              const total = course.lessons.length;
              return (
                <motion.button
                  key={courseId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setActiveTab("learn"); setSelectedCategory(courseId); }}
                  className="lesson-card w-full text-left flex items-center gap-4 group"
                >
                  <span className="text-2xl">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{course.label}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                        <div className="progress-fill h-full" style={{ width: `${(completed / total) * 100}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground xp-counter">{completed}/{total}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </motion.button>
              );
            })}
          </div>
        </>
      )}

      {/* Continue learning */}
      {nextLesson && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => onStartLesson(nextLesson.categoryId, nextLesson.lessonId)}
          className="lesson-card w-full text-left mb-6 group border-primary"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">Continue learning</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{nextLesson.emoji} {nextLesson.title}</h2>
          <p className="text-xs text-primary mt-2 font-medium">+15 XP per question</p>
        </motion.button>
      )}

      {enrolledCourses.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card text-center py-8">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No courses enrolled yet!</p>
          <p className="text-sm text-muted-foreground mb-4">Head to the Learn tab to browse and enroll in courses.</p>
          <Button onClick={() => setActiveTab("learn")} size="sm">Browse Courses</Button>
        </motion.div>
      )}
    </>
  );

  const renderLearn = () => (
    <>
      {!selectedCategory ? (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Mascot message="Explore all courses! Enroll in up to 3 at a time. 🎮" size="sm" animation="bounce" />
          </motion.div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="pl-10"
            />
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-4">All Courses ({filteredCourses.length})</h2>
          <div className="space-y-3">
            {filteredCourses.map((course, i) => {
              const completed = categoryProgress[course.id] || 0;
              const isEnrolled = enrolledCourses.includes(course.id);
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`lesson-card flex items-center gap-4 ${isEnrolled ? "border-primary/50" : ""}`}
                >
                  <button onClick={() => setSelectedCategory(course.id)} className="flex items-center gap-4 flex-1 text-left">
                    <span className="text-2xl">{course.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{course.label}</span>
                        {isEnrolled && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Enrolled</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{course.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 rounded-full bg-secondary overflow-hidden">
                          <div className="progress-fill h-full" style={{ width: `${(completed / course.lessons.length) * 100}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground xp-counter">{completed}/{course.lessons.length}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); isEnrolled ? onUnenroll(course.id) : handleEnroll(course.id); }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isEnrolled ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                    title={isEnrolled ? "Unenroll" : "Enroll"}
                  >
                    {isEnrolled ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setSelectedCategory(null)} className="text-sm text-muted-foreground hover:text-foreground mb-6 flex items-center gap-1">← Back to courses</button>
          {(() => {
            const course = COURSES.find(c => c.id === selectedCategory);
            const completed = categoryProgress[selectedCategory] || 0;
            const isEnrolled = enrolledCourses.includes(selectedCategory);
            if (!course) return null;
            return (
              <>
                <Mascot message={`Let's dive into ${course.label}! Each lesson earns XP. 🎮`} size="sm" animation="bounce" className="mb-6" />
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-semibold text-foreground">{course.emoji} {course.label}</h1>
                  {!isEnrolled && (
                    <Button size="sm" onClick={() => handleEnroll(course.id)} className="gap-1">
                      <Plus className="w-4 h-4" /> Enroll
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground mb-6">{course.description}</p>
                {course.image && (
                  <img src={course.image} alt={course.label} className="w-full h-40 object-cover rounded-xl mb-6" />
                )}
                <div className="space-y-3">
                  {course.lessons.map((lesson, i) => {
                    const status = i < completed ? "completed" : i === completed ? "current" : "locked";
                    return (
                      <motion.div key={lesson.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <button
                          onClick={status === "current" && isEnrolled ? () => onStartLesson(course.id, lesson.id) : undefined}
                          disabled={status === "locked" || !isEnrolled}
                          className={`lesson-card w-full text-left flex items-center gap-4 ${status === "current" && isEnrolled ? "border-primary" : ""} ${status === "locked" || !isEnrolled ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="shrink-0">
                            {status === "completed" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                            {status === "current" && <Circle className="w-5 h-5 text-primary" />}
                            {status === "locked" && <Lock className="w-5 h-5 text-muted-foreground" />}
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-foreground">{lesson.title}</span>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          </div>
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
                {!isEnrolled && (
                  <p className="text-sm text-muted-foreground mt-4 text-center">Enroll in this course to start learning!</p>
                )}
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
        <Mascot message="Climb the ranks! Every XP counts. 🏆" size="sm" animation="celebrate" />
      </motion.div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Global Leaderboard</h2>
      {leaderboard.length === 0 ? (
        <div className="lesson-card text-center py-8">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No rankings yet</p>
          <p className="text-sm text-muted-foreground">Complete lessons to earn XP!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, i) => {
            const isTop3 = entry.rank <= 3;
            const rankIcons = [null, Crown, Medal, Award];
            const RankIcon = rankIcons[entry.rank] || null;
            const lvl = getLevelForXp(entry.xp);
            return (
              <motion.div key={entry.userId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`lesson-card flex items-center gap-4 py-4 ${entry.isUser ? "border-primary bg-primary/5" : ""} ${isTop3 ? "border-accent/50" : ""}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                  entry.rank === 1 ? "bg-accent/20 text-accent-foreground" : "bg-secondary text-muted-foreground"
                }`}>{RankIcon ? <RankIcon className="w-4 h-4" /> : `#${entry.rank}`}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${entry.isUser ? "text-primary" : "text-foreground"}`}>{entry.isUser ? "You" : entry.name}</span>
                    <span className="text-xs text-muted-foreground">{lvl.emoji} Lv.{lvl.level}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3" /> {entry.xp} XP</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Flame className="w-3 h-3" /> {entry.streak}d</span>
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
        <Mascot message="Learning is better with friends! 🤝" size="sm" animation="bounce" />
      </motion.div>
      <h2 className="text-xl font-semibold text-foreground mb-4">Friends</h2>
      {pendingRequests.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pending ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map(req => {
              const profile = pendingProfiles[req.user_id];
              return (
                <div key={req.id} className="lesson-card flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><UserIcon className="w-4 h-4 text-primary" /></div>
                  <span className="flex-1 font-medium text-foreground text-sm">{profile?.display_name || "Anonymous"}</span>
                  <button onClick={() => handleAcceptFriend(req.id)} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20"><Check className="w-4 h-4" /></button>
                  <button onClick={() => handleRejectFriend(req.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20"><X className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {friends.length > 0 ? (
        <div className="space-y-3">
          {friends.map(friend => {
            const fId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
            const profile = friendProfiles[fId];
            const lvl = profile ? getLevelForXp(profile.xp) : null;
            return (
              <div key={friend.id} className="lesson-card flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><UserIcon className="w-5 h-5 text-accent-foreground" /></div>
                <div className="flex-1">
                  <span className="font-medium text-foreground">{profile?.display_name || "Anonymous"}</span>
                  <div className="flex items-center gap-3 mt-0.5">
                    {lvl && <span className="text-xs text-muted-foreground">{lvl.emoji} Lv.{lvl.level}</span>}
                    {profile && <span className="text-xs text-muted-foreground">{profile.xp} XP</span>}
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
          <p className="text-sm text-muted-foreground">Share your invite code!</p>
        </div>
      )}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lesson-card mt-6 text-center">
        <UserPlus className="w-8 h-8 text-primary mx-auto mb-2" />
        <h3 className="font-semibold text-foreground mb-1">Your Invite Code</h3>
        <div className="bg-secondary rounded-lg px-4 py-2 font-mono text-sm text-foreground inline-block">{user.id.slice(0, 8).toUpperCase()}</div>
      </motion.div>
    </>
  );

  const renderProfile = () => (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message={earnedBadges.length > 0 ? "Look at all your badges! Keep collecting! 🏅" : "Complete lessons to start earning badges! 🎯"} size="sm" animation="idle" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lesson-card text-center mb-6">
        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
          <img src={mascotImg} alt="Profile" className="w-14 h-14 object-contain" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{user.user_metadata?.display_name || user.email?.split("@")[0]}</h2>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        <div className="inline-flex items-center gap-2 mt-3 bg-secondary rounded-full px-4 py-1.5">
          <span className="text-lg">{levelInfo.current.emoji}</span>
          <span className="font-semibold text-foreground">Level {levelInfo.current.level}</span>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{xp}</div><div className="text-xs text-muted-foreground">XP</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{streak}</div><div className="text-xs text-muted-foreground">Streak</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{earnedBadges.length}</div><div className="text-xs text-muted-foreground">Badges</div></div>
        </div>
      </motion.div>

      <h3 className="text-lg font-semibold text-foreground mb-3">Badges</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {BADGE_DEFINITIONS.map((badge, i) => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={`lesson-card text-center py-4 ${!earned ? "opacity-40 grayscale" : ""}`}>
              <span className="text-3xl">{badge.emoji}</span>
              <p className="font-medium text-foreground text-sm mt-2">{badge.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
              {earned && <span className="inline-block mt-2 text-xs text-primary font-medium">Earned ✓</span>}
            </motion.div>
          );
        })}
      </div>

      <Button variant="outline" onClick={onOpenSettings} className="w-full gap-2 mb-3">
        <SettingsIcon className="w-4 h-4" /> Settings
      </Button>
      <Button variant="ghost" onClick={onSignOut} className="w-full text-muted-foreground hover:text-destructive gap-2">
        <LogOut className="w-4 h-4" /> Sign out
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
            {streak > 0 && (
              <div className="flex items-center gap-1.5 text-sm">
                <Flame className="w-4 h-4 text-destructive" />
                <span className="font-medium xp-counter text-foreground">{streak}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm">
              <Star className="w-4 h-4 text-accent" />
              <span className="font-medium xp-counter text-foreground">{xp}</span>
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
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}>
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
