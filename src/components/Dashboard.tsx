import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Home, BookOpen, Trophy, User as UserIcon, Flame, Star,
  ChevronRight, Lock, CheckCircle2, Circle, Medal, Crown, Award, LogOut,
  Users, UserPlus, Check, X, Search, Settings as SettingsIcon, Plus, Minus,
  Diamond, Heart, ShoppingBag, Target, MessageCircle, Gift, Send, ArrowLeft, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserConfig } from "@/components/Onboarding";
import Mascot from "@/components/Mascot";
import GemShop from "@/components/GemShop";
import Missions, { MISSIONS } from "@/components/Missions";
import type { MissionStats } from "@/components/Missions";
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
  if (streak >= 7) return `${timeGreeting}! ${streak}-day streak — you're absolutely unstoppable! 🔥⚡`;
  if (streak >= 3) return `${timeGreeting}! ${streak} days in a row — keep that streak alive! 🔥`;
  return `${timeGreeting}! Day ${streak} — let's keep the momentum going! 🎯`;
}

interface DashboardProps {
  config: UserConfig;
  onStartLesson: (categoryId: string, lessonId: number, isReview?: boolean) => void;
  user: SupabaseUser;
  onSignOut: () => Promise<void>;
  onOpenSettings: () => void;
  enrolledCourses: string[];
  onEnroll: (courseId: string) => Promise<boolean>;
  onUnenroll: (courseId: string) => Promise<void>;
  gems: number;
  extraLives: number;
  onPurchase: (itemId: string, cost: number) => Promise<boolean>;
}

interface FriendData { id: string; user_id: string; friend_id: string; status: string; }
interface ProfileData { id: string; user_id: string; display_name: string | null; xp: number; streak: number; level: number; }
interface LeaderboardEntry { rank: number; name: string; xp: number; streak: number; userId: string; isUser: boolean; }
interface ChatMessage { id: string; sender_id: string; receiver_id: string; content: string; gem_gift: number; created_at: string; }

const Dashboard = ({ config, onStartLesson, user, onSignOut, onOpenSettings, enrolledCourses, onEnroll, onUnenroll, gems, extraLives, onPurchase }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "missions" | "shop" | "profile">("home");
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
  const [claimedMissions, setClaimedMissions] = useState<string[]>([]);
  const [ownedTitles, setOwnedTitles] = useState<string[]>([]);
  const [totalLessonsCompleted, setTotalLessonsCompleted] = useState(0);
  const [inviteCode, setInviteCode] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  // Chat state
  const [chatFriend, setChatFriend] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [giftAmount, setGiftAmount] = useState(0);
  const { toast } = useToast();

  const levelInfo = getXpProgress(xp);
  const greetingMsg = getGreeting(streak);
  const myInviteCode = user.id.slice(0, 8).toUpperCase();

  const filteredCourses = COURSES.filter(c => {
    const matchesSearch = !searchQuery ||
      c.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

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
        let total = 0;
        progressRes.data.forEach(p => { if (p.completed) { progress[p.category_id] = (progress[p.category_id] || 0) + 1; total++; } });
        setCategoryProgress(progress);
        setTotalLessonsCompleted(total);
      }
      if (lbRes.data) {
        setLeaderboard(lbRes.data.map((p, i) => ({
          rank: i + 1, name: p.display_name || "Anonymous", xp: p.xp, streak: p.streak, userId: p.user_id, isUser: p.user_id === user.id,
        })));
      }
    };
    fetchAll();
  }, [user.id]);

  useEffect(() => {
    const channel = supabase.channel("my-profile")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => { const p = payload.new as any; setXp(p.xp); setStreak(p.streak); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

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

  useEffect(() => {
    const stored = localStorage.getItem(`missions_${user.id}`);
    if (stored) setClaimedMissions(JSON.parse(stored));
    const titles = localStorage.getItem(`titles_${user.id}`);
    if (titles) setOwnedTitles(JSON.parse(titles));
  }, [user.id]);

  // Load chat messages when chatFriend changes
  useEffect(() => {
    if (!chatFriend) { setChatMessages([]); return; }
    const loadMessages = async () => {
      const { data } = await supabase.from("friend_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatFriend}),and(sender_id.eq.${chatFriend},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setChatMessages(data as ChatMessage[]);
    };
    loadMessages();
    const channel = supabase.channel(`chat-${chatFriend}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "friend_messages" }, (payload) => {
        const msg = payload.new as ChatMessage;
        if ((msg.sender_id === user.id && msg.receiver_id === chatFriend) || (msg.sender_id === chatFriend && msg.receiver_id === user.id)) {
          setChatMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatFriend, user.id]);

  const handleAcceptFriend = async (id: string) => { await supabase.from("friendships").update({ status: "accepted" }).eq("id", id); setPendingRequests(prev => prev.filter(r => r.id !== id)); };
  const handleRejectFriend = async (id: string) => { await supabase.from("friendships").update({ status: "rejected" }).eq("id", id); setPendingRequests(prev => prev.filter(r => r.id !== id)); };

  const handleAddFriendByCode = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 8) {
      toast({ title: "Invalid code", description: "Enter a valid 8-character invite code.", variant: "destructive" });
      return;
    }
    setAddingFriend(true);
    const code = inviteCode.trim().toLowerCase();
    // Find user by invite code prefix
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").ilike("user_id", `${code}%`);
    if (!profiles || profiles.length === 0) {
      toast({ title: "User not found", description: "No user matches this invite code.", variant: "destructive" });
      setAddingFriend(false);
      return;
    }
    const target = profiles[0];
    if (target.user_id === user.id) {
      toast({ title: "That's you!", description: "You can't add yourself as a friend.", variant: "destructive" });
      setAddingFriend(false);
      return;
    }
    // Check if already friends or pending
    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${target.user_id}),and(user_id.eq.${target.user_id},friend_id.eq.${user.id})`);
    if (existing && existing.length > 0) {
      toast({ title: "Already connected", description: "You already have a friendship with this user." });
      setAddingFriend(false);
      return;
    }
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: target.user_id, status: "pending" });
    if (error) {
      toast({ title: "Error", description: "Failed to send friend request.", variant: "destructive" });
    } else {
      toast({ title: "Friend request sent! 🤝", description: `Request sent to ${target.display_name || "user"}.` });
      setInviteCode("");
    }
    setAddingFriend(false);
  };

  const handleSendMessage = async () => {
    if (!chatFriend || (!chatInput.trim() && giftAmount <= 0)) return;
    const content = chatInput.trim() || (giftAmount > 0 ? `Sent you ${giftAmount} gems! 💎` : "");
    if (!content) return;

    if (giftAmount > 0) {
      if (gems < giftAmount) {
        toast({ title: "Not enough gems", variant: "destructive" });
        return;
      }
      // Deduct gems from sender
      const { data: myProfile } = await supabase.from("profiles").select("gems").eq("user_id", user.id).single();
      if (myProfile) {
        await supabase.from("profiles").update({ gems: (myProfile as any).gems - giftAmount } as any).eq("user_id", user.id);
      }
      // Add gems to receiver
      const { data: friendProfile } = await supabase.from("profiles").select("gems").eq("user_id", chatFriend).single();
      if (friendProfile) {
        await supabase.from("profiles").update({ gems: (friendProfile as any).gems + giftAmount } as any).eq("user_id", chatFriend);
      }
    }

    await supabase.from("friend_messages").insert({
      sender_id: user.id,
      receiver_id: chatFriend,
      content,
      gem_gift: giftAmount,
    } as any);

    setChatInput("");
    setGiftAmount(0);
  };

  const handleEnroll = async (courseId: string) => {
    const success = await onEnroll(courseId);
    if (!success) {
      toast({ title: "Course limit reached", description: "You can only study 3 courses at a time. Unenroll from one first.", variant: "destructive" });
    }
  };

  const handleClaimMission = async (missionId: string, reward: number) => {
    const newClaimed = [...claimedMissions, missionId];
    setClaimedMissions(newClaimed);
    localStorage.setItem(`missions_${user.id}`, JSON.stringify(newClaimed));
    const { data: profile } = await supabase.from("profiles").select("gems").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ gems: (profile as any).gems + reward } as any).eq("user_id", user.id);
    }
    toast({ title: `💎 +${reward} Gems!`, description: "Mission completed!" });
  };

  const handlePurchase = async (itemId: string, cost: number) => {
    const success = await onPurchase(itemId, cost);
    if (success && itemId.startsWith("title-")) {
      const newTitles = [...ownedTitles, itemId];
      setOwnedTitles(newTitles);
      localStorage.setItem(`titles_${user.id}`, JSON.stringify(newTitles));
    }
    return success;
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

  const missionStats: MissionStats = {
    lessonsCompleted: totalLessonsCompleted,
    totalXp: xp,
    streak,
    quizzesCorrect: 0,
    coursesEnrolled: enrolledCourses.length,
    friendsCount: friends.length,
  };

  // Chat view for a friend
  if (chatFriend) {
    const fProfile = friendProfiles[chatFriend];
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-3">
            <button onClick={() => setChatFriend(null)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <UserIcon className="w-5 h-5 text-primary" />
            <span className="font-medium text-foreground">{fProfile?.display_name || "Friend"}</span>
            <span className="text-xs text-muted-foreground ml-auto">{fProfile?.xp || 0} XP</span>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto px-6 py-4 w-full overflow-y-auto">
          {chatMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">No messages yet. Say hi! 👋</p>
            </div>
          )}
          <div className="space-y-3">
            {chatMessages.map(msg => {
              const isMine = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"}`}>
                    {msg.gem_gift > 0 && (
                      <div className={`flex items-center gap-1 mb-1 text-xs font-medium ${isMine ? "text-primary-foreground/80" : "text-cyan-500"}`}>
                        <Diamond className="w-3 h-3" /> {msg.gem_gift} gems gifted
                      </div>
                    )}
                    {msg.content}
                    <div className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
        <div className="sticky bottom-0 bg-background border-t border-border p-4">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <Button variant="outline" size="icon" className="shrink-0" onClick={() => setGiftAmount(prev => prev > 0 ? 0 : 5)} title="Gift gems">
              <Gift className={`w-4 h-4 ${giftAmount > 0 ? "text-cyan-500" : "text-muted-foreground"}`} />
            </Button>
            {giftAmount > 0 && (
              <Input type="number" min={1} value={giftAmount} onChange={e => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-16 text-center" placeholder="💎" />
            )}
            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..."
              className="flex-1" onKeyDown={e => e.key === "Enter" && handleSendMessage()} />
            <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim() && giftAmount <= 0}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-3 gap-3 mb-6">
        <div className="lesson-card flex flex-col items-center py-4">
          <Flame className="w-5 h-5 text-destructive mb-1" />
          <div className="text-lg font-semibold text-foreground xp-counter">{streak}</div>
          <div className="text-xs text-muted-foreground">Streak</div>
        </div>
        <div className="lesson-card flex flex-col items-center py-4">
          <Star className="w-5 h-5 text-accent mb-1" />
          <div className="text-lg font-semibold text-foreground xp-counter">{xp}</div>
          <div className="text-xs text-muted-foreground">XP</div>
        </div>
        <div className="lesson-card flex flex-col items-center py-4">
          <Diamond className="w-5 h-5 text-cyan-500 mb-1" />
          <div className="text-lg font-semibold text-foreground xp-counter">{gems}</div>
          <div className="text-xs text-muted-foreground">Gems</div>
        </div>
      </motion.div>

      {/* Extra lives */}
      {extraLives > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card mb-4 flex items-center gap-3 py-3 border-destructive/30">
          <Heart className="w-5 h-5 text-destructive" fill="currentColor" />
          <span className="text-sm text-foreground font-medium">{extraLives} extra {extraLives === 1 ? "life" : "lives"} available</span>
        </motion.div>
      )}

      {/* Add friend by invite code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Add Friend
        </h3>
        <div className="flex gap-2 mb-2">
          <Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Enter invite code..." className="flex-1 font-mono"
            maxLength={8} onKeyDown={e => e.key === "Enter" && handleAddFriendByCode()} />
          <Button size="sm" onClick={handleAddFriendByCode} disabled={addingFriend || inviteCode.length < 8}>
            {addingFriend ? "..." : "Add"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Your code: <span className="font-mono font-semibold text-foreground">{myInviteCode}</span></p>
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
                <motion.button key={courseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setActiveTab("learn"); setSelectedCategory(courseId); }}
                  className="lesson-card w-full text-left flex items-center gap-4 group">
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
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          onClick={() => onStartLesson(nextLesson.categoryId, nextLesson.lessonId)}
          className="lesson-card w-full text-left mb-6 group border-primary">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary">Continue learning</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{nextLesson.emoji} {nextLesson.title}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-primary font-medium">+15 XP per question</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="w-3 h-3 text-destructive" /> 3 lives</span>
          </div>
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

  // Path map offsets for winding effect
  const PATH_OFFSETS = [0, 40, 70, 40, 0, -40, -70, -40];

  const renderCoursePath = (course: typeof COURSES[0]) => {
    const completed = categoryProgress[course.id] || 0;
    const isEnrolled = enrolledCourses.includes(course.id);

    return (
      <div className="relative flex flex-col items-center gap-0 py-4">
        {/* Central line */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-border -translate-x-1/2 z-0" />

        {course.lessons.map((lesson, i) => {
          const isCompleted = i < completed;
          const isCurrent = i === completed;
          const isLocked = i > completed;
          const canPlay = (isCompleted || (isCurrent && isEnrolled));
          const offset = PATH_OFFSETS[i % PATH_OFFSETS.length];

          return (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="relative z-10 mb-8"
              style={{ transform: `translateX(${offset}px)` }}
            >
              <button
                onClick={() => {
                  if (isCompleted) onStartLesson(course.id, lesson.id, true);
                  else if (isCurrent && isEnrolled) onStartLesson(course.id, lesson.id, false);
                }}
                disabled={!canPlay}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 border-4 ${
                  isCompleted ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" :
                  isCurrent && isEnrolled ? "bg-primary border-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg" :
                  "bg-muted border-border text-muted-foreground"
                } ${canPlay ? "cursor-pointer hover:scale-110" : "cursor-not-allowed opacity-60"}`}
              >
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
                 isCurrent ? <Star className="w-6 h-6" /> :
                 <Lock className="w-5 h-5" />}
              </button>
              <div className="mt-2 text-center max-w-[140px]">
                <p className="text-xs font-medium text-foreground leading-tight">{lesson.title}</p>
                {isCompleted && (
                  <p className="text-xs text-primary flex items-center justify-center gap-1 mt-0.5">
                    <RotateCcw className="w-3 h-3" /> Review
                  </p>
                )}
                {isCurrent && isEnrolled && (
                  <p className="text-xs text-primary font-medium mt-0.5">Start →</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  const renderLearn = () => (
    <>
      {!selectedCategory ? (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Mascot message="Explore all courses! Enroll in up to 3 at a time. 🎮" size="sm" animation="bounce" />
          </motion.div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search courses..." className="pl-10" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-4">All Courses ({filteredCourses.length})</h2>
          <div className="space-y-3">
            {filteredCourses.map((course, i) => {
              const completed = categoryProgress[course.id] || 0;
              const isEnrolled = enrolledCourses.includes(course.id);
              return (
                <motion.div key={course.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`lesson-card flex items-center gap-4 ${isEnrolled ? "border-primary/50" : ""}`}>
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
                  <button onClick={(e) => { e.stopPropagation(); isEnrolled ? onUnenroll(course.id) : handleEnroll(course.id); }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isEnrolled ? "bg-destructive/10 text-destructive hover:bg-destructive/20" : "bg-primary/10 text-primary hover:bg-primary/20"
                    }`} title={isEnrolled ? "Unenroll" : "Enroll"}>
                    {isEnrolled ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <button onClick={() => setSelectedCategory(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">← Back to courses</button>
          {(() => {
            const course = COURSES.find(c => c.id === selectedCategory);
            const isEnrolled = enrolledCourses.includes(selectedCategory);
            if (!course) return null;
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-semibold text-foreground">{course.emoji} {course.label}</h1>
                  {!isEnrolled && (
                    <Button size="sm" onClick={() => handleEnroll(course.id)} className="gap-1">
                      <Plus className="w-4 h-4" /> Enroll
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{course.description}</p>
                {course.image && <img src={course.image} alt={course.label} className="w-full h-40 object-cover rounded-xl mb-4" />}

                {/* Path Map */}
                {renderCoursePath(course)}

                {!isEnrolled && <p className="text-sm text-muted-foreground mt-4 text-center">Enroll in this course to start learning!</p>}
              </>
            );
          })()}
        </>
      )}
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
        <div className="flex justify-center gap-4 mt-4">
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{xp}</div><div className="text-xs text-muted-foreground">XP</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{streak}</div><div className="text-xs text-muted-foreground">Streak</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{gems}</div><div className="text-xs text-muted-foreground">Gems</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{earnedBadges.length}</div><div className="text-xs text-muted-foreground">Badges</div></div>
        </div>
      </motion.div>

      {/* Invite code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card text-center mb-6 border-primary/30">
        <p className="text-sm text-muted-foreground mb-1">Your Invite Code</p>
        <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{myInviteCode}</p>
        <p className="text-xs text-muted-foreground mt-1">Share with friends to connect!</p>
      </motion.div>

      {/* Leaderboard */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Leaderboard</h3>
      {leaderboard.length > 0 ? (
        <div className="space-y-2 mb-6">
          {leaderboard.slice(0, 5).map((entry) => {
            const rankEmojis = ["", "🥇", "🥈", "🥉"];
            const lvl = getLevelForXp(entry.xp);
            return (
              <div key={entry.userId} className={`lesson-card flex items-center gap-3 py-3 ${entry.isUser ? "border-primary bg-primary/5" : ""}`}>
                <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                  {rankEmojis[entry.rank] || `#${entry.rank}`}
                </div>
                <div className="flex-1">
                  <span className={`font-medium text-sm ${entry.isUser ? "text-primary" : "text-foreground"}`}>{entry.isUser ? "You" : entry.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{lvl.emoji} {entry.xp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Friends */}
      <h3 className="text-lg font-semibold text-foreground mb-3">Friends ({friends.length})</h3>
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Pending requests</p>
          {pendingRequests.map(req => {
            const profile = pendingProfiles[req.user_id];
            return (
              <div key={req.id} className="lesson-card flex items-center gap-3 py-3 mb-2">
                <UserIcon className="w-4 h-4 text-primary" />
                <span className="flex-1 font-medium text-foreground text-sm">{profile?.display_name || "Anonymous"}</span>
                <button onClick={() => handleAcceptFriend(req.id)} className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Check className="w-3 h-3" /></button>
                <button onClick={() => handleRejectFriend(req.id)} className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive"><X className="w-3 h-3" /></button>
              </div>
            );
          })}
        </div>
      )}
      {friends.length > 0 ? (
        <div className="space-y-2 mb-6">
          {friends.map(friend => {
            const fId = friend.user_id === user.id ? friend.friend_id : friend.user_id;
            const profile = friendProfiles[fId];
            return (
              <button key={friend.id} onClick={() => setChatFriend(fId)} className="lesson-card flex items-center gap-3 py-3 w-full text-left hover:border-primary transition-colors">
                <UserIcon className="w-4 h-4 text-accent" />
                <span className="font-medium text-foreground text-sm">{profile?.display_name || "Anonymous"}</span>
                <div className="ml-auto flex items-center gap-2">
                  {profile && <span className="text-xs text-muted-foreground">{profile.xp} XP</span>}
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="lesson-card text-center py-6 mb-6">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No friends yet — share your invite code!</p>
        </div>
      )}

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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-medium bg-secondary rounded-full px-2 py-1">
              <span>{levelInfo.current.emoji}</span>
              <span className="text-foreground">Lv.{levelInfo.current.level}</span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Flame className="w-3.5 h-3.5 text-destructive" />
                <span className="font-medium xp-counter text-foreground">{streak}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-xs">
              <Diamond className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-medium xp-counter text-foreground">{gems}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3.5 h-3.5 text-accent" />
              <span className="font-medium xp-counter text-foreground">{xp}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6">
        {activeTab === "home" && renderHome()}
        {activeTab === "learn" && renderLearn()}
        {activeTab === "missions" && (
          <Missions stats={missionStats} claimedMissions={claimedMissions} onClaim={handleClaimMission} />
        )}
        {activeTab === "shop" && (
          <GemShop gems={gems} extraLives={extraLives} ownedTitles={ownedTitles} onPurchase={handlePurchase} />
        )}
        {activeTab === "profile" && renderProfile()}
      </main>

      <div className="thumb-bar">
        {[
          { id: "home" as const, icon: Home, label: "Home" },
          { id: "learn" as const, icon: BookOpen, label: "Learn" },
          { id: "missions" as const, icon: Target, label: "Missions" },
          { id: "shop" as const, icon: ShoppingBag, label: "Shop" },
          { id: "profile" as const, icon: UserIcon, label: "Profile" },
        ].map(tab => {
          const Icon = tab.icon;
          // Calculate claimable missions count for badge
          const claimableCount = tab.id === "missions"
            ? MISSIONS.filter((m, i) => {
                const currentIdx = MISSIONS.findIndex(mi => !claimedMissions.includes(mi.id));
                return i === currentIdx && !claimedMissions.includes(m.id) && m.requirement(missionStats);
              }).length
            : 0;
          return (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedCategory(null); }}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors relative ${activeTab === tab.id ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-5 h-5" />
              {claimableCount > 0 && (
                <span className="absolute -top-1 right-0 min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
                  {claimableCount}
                </span>
              )}
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Dashboard;
