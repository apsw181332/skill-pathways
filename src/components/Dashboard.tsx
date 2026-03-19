import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  Home, BookOpen, Trophy, User as UserIcon, Flame, Star,
  ChevronRight, Lock, CheckCircle2, Circle, Medal, Crown, Award, LogOut,
  Users, UserPlus, Check, X, Search, Settings as SettingsIcon, Plus, Minus,
  Diamond, Heart, ShoppingBag, Target, MessageCircle, Gift, Send, ArrowLeft, RotateCcw,
  Camera, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UserConfig } from "@/components/Onboarding";
import Mascot from "@/components/Mascot";
import GemShop from "@/components/GemShop";
import FriendsPage from "@/components/FriendsPage";
import Missions, { MISSIONS, TITLE_REWARDS } from "@/components/Missions";
import type { MissionStats } from "@/components/Missions";
import mascotImg from "@/assets/mascot-penguin.png";
import { getLevelForXp, getXpProgress, LEVELS } from "@/lib/levels";
import { COURSES } from "@/lib/courseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, type Locale } from "@/lib/i18n";
import { useTranslatedContent } from "@/hooks/useTranslation";

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
  locale?: Locale;
}

interface FriendData { id: string; user_id: string; friend_id: string; status: string; }
interface ProfileData { id: string; user_id: string; display_name: string | null; xp: number; streak: number; level: number; }
interface LeaderboardEntry { rank: number; name: string; xp: number; streak: number; userId: string; isUser: boolean; }
interface ChatMessage { id: string; sender_id: string; receiver_id: string; content: string; gem_gift: number; created_at: string; }

const Dashboard = ({ config, onStartLesson, user, onSignOut, onOpenSettings, enrolledCourses, onEnroll, onUnenroll, gems, extraLives, onPurchase, locale = "en" }: DashboardProps) => {
  const { t } = useTranslation(locale);
  const [activeTab, setActiveTab] = useState<"home" | "learn" | "missions" | "friends" | "shop" | "profile">("home");
  const [dailyLessonCount, setDailyLessonCount] = useState(0);
  const [showLimitBanner, setShowLimitBanner] = useState(false);
  const FREE_DAILY_LIMIT = 2;
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const levelInfo = getXpProgress(xp);
  const greetingMsgEn = getGreeting(streak);
  const dashboardMascotTexts = useMemo(() => [
    greetingMsgEn,
    "Explore all courses! Enroll in up to 3 at a time. 🎮",
    "Look at all your badges! Keep collecting! 🏅",
    "Complete lessons to start earning badges! 🎯",
  ], [greetingMsgEn]);
  const { translated: tDashMascot } = useTranslatedContent(dashboardMascotTexts, locale, "dashboard mascot messages");

  // Translate course names and descriptions
  const courseTexts = useMemo(() => COURSES.flatMap(c => [c.label, c.description]), []);
  const { translated: tCourseTexts } = useTranslatedContent(courseTexts, locale, "course names and descriptions");
  const getCourseName = (idx: number) => tCourseTexts[idx * 2] ?? COURSES[idx]?.label ?? "";
  const getCourseDesc = (idx: number) => tCourseTexts[idx * 2 + 1] ?? COURSES[idx]?.description ?? "";
  const greetingMsg = tDashMascot[0] ?? greetingMsgEn;
  const [myInviteCode, setMyInviteCode] = useState(user.id.slice(0, 8).toUpperCase());

  const filteredCourses = COURSES.map((c, i) => ({ ...c, tLabel: getCourseName(i), tDesc: getCourseDesc(i) })).filter(c => {
    const matchesSearch = !searchQuery ||
      c.tLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    const fetchAll = async () => {
      const [profileRes, achieveRes, progressRes, lbRes] = await Promise.all([
        supabase.from("profiles").select("xp, streak, avatar_url, friend_code").eq("user_id", user.id).single(),
        supabase.from("achievements").select("badge_id").eq("user_id", user.id),
        supabase.from("user_progress").select("category_id, lesson_id, completed, completed_at").eq("user_id", user.id),
        supabase.from("profiles").select("user_id, display_name, xp, streak").order("xp", { ascending: false }).limit(50),
      ]);
      if (profileRes.data) {
        setXp(profileRes.data.xp);
        setStreak(profileRes.data.streak);
        setAvatarUrl((profileRes.data as any).avatar_url || null);
        if ((profileRes.data as any).friend_code) setMyInviteCode((profileRes.data as any).friend_code);
      }
      if (achieveRes.data) {
        const badges = achieveRes.data.map(a => a.badge_id);
        setEarnedBadges(badges);
        // Load claimed missions from achievements (badge_id starts with "mission-")
        const claimed = badges.filter(b => b.startsWith("mission-")).map(b => b.replace("mission-", ""));
        setClaimedMissions(claimed);
        // Load earned titles from achievements
        const titles = badges.filter(b => b.startsWith("title-"));
        setOwnedTitles(titles);
      }
      if (progressRes.data) {
        const progress: Record<string, number> = {};
        let total = 0;
        const today = new Date().toISOString().split("T")[0];
        let todayCount = 0;
        progressRes.data.forEach(p => {
          if (p.completed) {
            progress[p.category_id] = (progress[p.category_id] || 0) + 1;
            total++;
            if ((p as any).completed_at && (p as any).completed_at.startsWith(today)) todayCount++;
          }
        });
        setCategoryProgress(progress);
        setTotalLessonsCompleted(total);
        setDailyLessonCount(todayCount);
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

  const refreshSocialData = useCallback(async () => {
    const [sent, received, pending] = await Promise.all([
      supabase.from("friendships").select("*").eq("user_id", user.id).eq("status", "accepted"),
      supabase.from("friendships").select("*").eq("friend_id", user.id).eq("status", "accepted"),
      supabase.from("friendships").select("*").eq("friend_id", user.id).eq("status", "pending"),
    ]);

    const allFriends = [...(sent.data || []), ...(received.data || [])] as FriendData[];
    const pendingRows = (pending.data || []) as FriendData[];
    setFriends(allFriends);
    setPendingRequests(pendingRows);

    const friendIds = [...new Set(allFriends.map((friend) => friend.user_id === user.id ? friend.friend_id : friend.user_id))];
    const pendingIds = [...new Set(pendingRows.map((request) => request.user_id))];

    if (friendIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level, id").in("user_id", friendIds);
      if (data) {
        const map: Record<string, ProfileData> = {};
        data.forEach((profile) => {
          map[profile.user_id] = profile;
        });
        setFriendProfiles(map);
      }
    } else {
      setFriendProfiles({});
    }

    if (pendingIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level, id").in("user_id", pendingIds);
      if (data) {
        const map: Record<string, ProfileData> = {};
        data.forEach((profile) => {
          map[profile.user_id] = profile;
        });
        setPendingProfiles(map);
      }
    } else {
      setPendingProfiles({});
    }
  }, [user.id]);

  useEffect(() => {
    refreshSocialData();

    const channel = supabase.channel(`friendships-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, (payload) => {
        const row = (payload.new || payload.old) as Partial<FriendData>;
        if (row.user_id === user.id || row.friend_id === user.id) {
          refreshSocialData();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [refreshSocialData, user.id]);

  // Missions and titles are now loaded from achievements in fetchAll above

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
        const message = payload.new as ChatMessage;
        if ((message.sender_id === user.id && message.receiver_id === chatFriend) || (message.sender_id === chatFriend && message.receiver_id === user.id)) {
          setChatMessages((prev) => prev.some((entry) => entry.id === message.id) ? prev : [...prev, message]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [chatFriend, user.id]);

  const handleAcceptFriend = async (id: string) => {
    const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    if (error) {
      toast({ title: "Could not accept request", description: error.message, variant: "destructive" });
      return;
    }
    await refreshSocialData();
  };

  const handleRejectFriend = async (id: string) => {
    const { error } = await supabase.from("friendships").update({ status: "rejected" }).eq("id", id);
    if (error) {
      toast({ title: "Could not reject request", description: error.message, variant: "destructive" });
      return;
    }
    await refreshSocialData();
  };

  const handleAddFriendByCode = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 8) {
      toast({ title: "Invalid code", description: "Enter a valid 8-character invite code.", variant: "destructive" });
      return;
    }

    setAddingFriend(true);
    const code = inviteCode.trim().toUpperCase();
    
    // Search by friend_code column
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").eq("friend_code", code);

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

    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(user_id.eq.${user.id},friend_id.eq.${target.user_id}),and(user_id.eq.${target.user_id},friend_id.eq.${user.id})`);

    if (existing && existing.length > 0) {
      toast({ title: "Already connected", description: "You already have a friendship with this user." });
      setAddingFriend(false);
      return;
    }

    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: target.user_id, status: "pending" });
    if (error) {
      toast({ title: "Error", description: error.message || "Failed to send friend request.", variant: "destructive" });
    } else {
      toast({ title: "Friend request sent! 🤝", description: `Request sent to ${target.display_name || "user"}.` });
      setInviteCode("");
      await refreshSocialData();
    }
    setAddingFriend(false);
  };

  const handleSendMessage = async () => {
    if (!chatFriend || (!chatInput.trim() && giftAmount <= 0)) return;

    const { data, error } = await supabase.functions.invoke("friend-send-message", {
      body: {
        receiver_id: chatFriend,
        content: chatInput.trim(),
        gem_gift: giftAmount,
      },
    });

    if (error || data?.error) {
      toast({ title: "Could not send message", description: data?.error || error?.message || "Please try again.", variant: "destructive" });
      return;
    }

    if (data?.message) {
      setChatMessages((prev) => prev.some((entry) => entry.id === data.message.id) ? prev : [...prev, data.message as ChatMessage]);
    }

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
    // Persist to achievements table with "mission-" prefix
    const { error } = await supabase.from("achievements").insert({ user_id: user.id, badge_id: `mission-${missionId}` });
    if (error) {
      // Already claimed (unique constraint or duplicate)
      toast({ title: "Already claimed!", description: "This mission was already completed.", variant: "destructive" });
      return;
    }
    const newClaimed = [...claimedMissions, missionId];
    setClaimedMissions(newClaimed);
    const { data: profile } = await supabase.from("profiles").select("gems").eq("user_id", user.id).single();
    if (profile) {
      await supabase.from("profiles").update({ gems: (profile as any).gems + reward } as any).eq("user_id", user.id);
    }
    toast({ title: `💎 +${reward} Gems!`, description: "Mission completed!" });

    // Check if this mission unlocks a title
    const titleReward = TITLE_REWARDS[missionId];
    if (titleReward) {
      const titleId = `title-${titleReward.title.toLowerCase().replace(/\s+/g, '-')}`;
      await supabase.from("achievements").insert({ user_id: user.id, badge_id: titleId });
      setOwnedTitles(prev => [...prev, titleId]);
      toast({ title: `🏅 Title Unlocked!`, description: `You earned the "${titleReward.title}" title!` });
    }
  };

  const handlePurchase = async (itemId: string, cost: number) => {
    const success = await onPurchase(itemId, cost);
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
          <div className="text-xs text-muted-foreground">{t("general.streak")}</div>
        </div>
        <div className="lesson-card flex flex-col items-center py-4">
          <Star className="w-5 h-5 text-accent mb-1" />
          <div className="text-lg font-semibold text-foreground xp-counter">{xp}</div>
          <div className="text-xs text-muted-foreground">{t("general.xp")}</div>
        </div>
        <div className="lesson-card flex flex-col items-center py-4">
          <Diamond className="w-5 h-5 text-cyan-500 mb-1" />
          <div className="text-lg font-semibold text-foreground xp-counter">{gems}</div>
          <div className="text-xs text-muted-foreground">{t("general.gems")}</div>
        </div>
      </motion.div>

      {/* Extra lives */}
      {extraLives > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card mb-4 flex items-center gap-3 py-3 border-destructive/30">
          <Heart className="w-5 h-5 text-destructive" fill="currentColor" />
          <span className="text-sm text-foreground font-medium">{extraLives} {t(extraLives === 1 ? "general.life_available" : "general.lives_available")}</span>
        </motion.div>
      )}

      {/* Add friend by invite code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> {t("home.add_friend")}
        </h3>
        <div className="flex gap-2 mb-2">
          <Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Enter invite code..." className="flex-1 font-mono"
            maxLength={8} onKeyDown={e => e.key === "Enter" && handleAddFriendByCode()} />
          <Button size="sm" onClick={handleAddFriendByCode} disabled={addingFriend || inviteCode.length < 8}>
            {addingFriend ? "..." : "Add"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("home.your_code")}: <span className="font-mono font-semibold text-foreground">{myInviteCode}</span></p>
      </motion.div>

      {/* Enrolled courses */}
      {enrolledCourses.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-foreground mb-3">{t("home.your_courses")} ({enrolledCourses.length}/3)</h2>
          <div className="space-y-3 mb-6">
            {enrolledCourses.map(courseId => {
              const course = COURSES.find(c => c.id === courseId);
              if (!course) return null;
              const courseIdx = COURSES.findIndex(c => c.id === courseId);
              const tLabel = getCourseName(courseIdx);
              const completed = categoryProgress[courseId] || 0;
              const total = course.lessons.length;
              return (
                <motion.button key={courseId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  onClick={() => { setActiveTab("learn"); setSelectedCategory(courseId); }}
                  className="lesson-card w-full text-left flex items-center gap-4 group">
                  <span className="text-2xl">{course.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground">{tLabel || course.label}</span>
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
            <span className="text-sm font-medium text-primary">{t("home.continue")}</span>
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
          <p className="text-foreground font-medium mb-1">{t("home.no_courses")}</p>
          <p className="text-sm text-muted-foreground mb-4">{t("home.browse")}</p>
          <Button onClick={() => setActiveTab("learn")} size="sm">{t("home.browse_btn")}</Button>
        </motion.div>
      )}
    </>
  );

  // Duolingo-style path with zigzag nodes
  const renderCoursePath = (course: typeof COURSES[0]) => {
    const completed = categoryProgress[course.id] || 0;
    const isEnrolled = enrolledCourses.includes(course.id);
    const totalLessons = course.lessons.length;
    const nodeSpacing = 90; // px between nodes vertically

    // S-curve positions (percentage offsets from center)
    const getOffsetX = (i: number) => {
      const pattern = [0, 30, 50, 30, 0, -30, -50, -30];
      return pattern[i % pattern.length];
    };

    return (
      <div className="relative mx-auto" style={{ height: totalLessons * nodeSpacing + 60, maxWidth: 320 }}>
        {/* SVG connecting lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
          {course.lessons.map((_, i) => {
            if (i === 0) return null;
            const x1 = 50 + getOffsetX(i - 1);
            const y1 = (i - 1) * nodeSpacing + 40;
            const x2 = 50 + getOffsetX(i);
            const y2 = i * nodeSpacing + 40;
            const isPast = i <= completed;
            return (
              <line key={`seg-${i}`}
                x1={`${x1}%`} y1={y1} x2={`${x2}%`} y2={y2}
                stroke={isPast ? "hsl(var(--primary))" : "hsl(var(--border))"}
                strokeWidth="4" strokeLinecap="round"
                strokeDasharray={isPast ? "none" : "8 6"}
                opacity={isPast ? 1 : 0.5}
              />
            );
          })}
        </svg>

        {course.lessons.map((lesson, i) => {
          const isCompleted = i < completed;
          const isCurrent = i === completed;
          const canPlay = isCompleted || (isCurrent && isEnrolled);
          const offsetX = getOffsetX(i);
          const showMascot = isCurrent && isEnrolled;
          const showChestIcon = i > 0 && i % 5 === 4;

          return (
            <div
              key={lesson.id}
              className="absolute flex flex-col items-center"
              style={{
                left: `${50 + offsetX}%`,
                top: i * nodeSpacing + 10,
                transform: "translateX(-50%)",
                zIndex: isCurrent ? 20 : 10,
              }}
            >
              {/* Mascot on current node */}
              {showMascot && (
                <motion.div
                  initial={{ y: 0 }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-11 z-30"
                >
                  <img src={mascotImg} alt="Pebble" className="w-9 h-9 object-contain drop-shadow-md" />
                </motion.div>
              )}

              {/* Treasure chest icon on every 5th */}
              {showChestIcon && isCompleted && (
                <div className="absolute -right-5 -top-1 text-base">🎁</div>
              )}

              <motion.button
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 20 }}
                onClick={() => {
                  if (isCompleted) onStartLesson(course.id, lesson.id, true);
                  else if (isCurrent && isEnrolled) onStartLesson(course.id, lesson.id, false);
                }}
                disabled={!canPlay}
                className={`${isCurrent ? "w-[68px] h-[68px]" : "w-[60px] h-[60px]"} rounded-full flex items-center justify-center font-bold transition-all duration-200 border-[5px] ${
                  isCompleted
                    ? "bg-primary border-primary/80 text-primary-foreground shadow-lg shadow-primary/25"
                    : isCurrent && isEnrolled
                    ? "bg-primary border-primary text-primary-foreground ring-[6px] ring-primary/15 shadow-xl shadow-primary/30"
                    : "bg-muted border-border text-muted-foreground opacity-50"
                } ${canPlay ? "cursor-pointer hover:scale-110 active:scale-95" : "cursor-not-allowed"}`}
              >
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> :
                 isCurrent ? <Star className="w-6 h-6" /> :
                 <Lock className="w-4 h-4" />}
              </motion.button>

              <div className="mt-1.5 text-center max-w-[110px]">
                <p className={`text-[11px] font-medium leading-tight ${!canPlay ? "text-muted-foreground/50" : "text-foreground"}`}>
                  {lesson.title}
                </p>
                {isCompleted && (
                  <div className="flex justify-center gap-0.5 mt-0.5">
                    {[1, 2, 3].map(s => (
                      <Star key={s} className="w-2.5 h-2.5 text-accent" fill="currentColor" />
                    ))}
                  </div>
                )}
                {isCurrent && isEnrolled && (
                  <p className="text-[10px] text-primary font-semibold mt-0.5">{t("general.start_arrow")}</p>
                )}
              </div>
            </div>
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
            <Mascot message={tDashMascot[1] ?? "Explore all courses! Enroll in up to 3 at a time. 🎮"} size="sm" animation="bounce" />
          </motion.div>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder={t("learn.search")} className="pl-10" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-4">{t("learn.title")} ({filteredCourses.length})</h2>
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
                        <span className="font-medium text-foreground">{course.tLabel || course.label}</span>
                        {isEnrolled && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t("learn.enrolled")}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground">{course.tDesc || course.description}</p>
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
          <button onClick={() => setSelectedCategory(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1">{t("learn.back")}</button>
          {(() => {
            const course = COURSES.find(c => c.id === selectedCategory);
            const courseIdx = COURSES.findIndex(c => c.id === selectedCategory);
            const isEnrolled = enrolledCourses.includes(selectedCategory);
            if (!course) return null;
            const tLabel = getCourseName(courseIdx);
            const tDesc = getCourseDesc(courseIdx);
            return (
              <>
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-semibold text-foreground">{course.emoji} {tLabel || course.label}</h1>
                  {!isEnrolled && (
                    <Button size="sm" onClick={() => handleEnroll(course.id)} className="gap-1">
                       <Plus className="w-4 h-4" /> {t("learn.enroll")}
                    </Button>
                  )}
                </div>
                <p className="text-muted-foreground mb-2">{tDesc || course.description}</p>
                {course.image && <img src={course.image} alt={course.label} className="w-full h-40 object-cover rounded-xl mb-4" />}

                {/* Path Map */}
                {renderCoursePath(course)}

                {!isEnrolled && <p className="text-sm text-muted-foreground mt-4 text-center">{t("learn.enroll_to_start")}</p>}
              </>
            );
          })()}
        </>
      )}
    </>
  );

  const renderProfile = () => {
    const fileInputRef = document.createElement("input");

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl } as any).eq("user_id", user.id);
      setAvatarUrl(urlData.publicUrl);
      toast({ title: "Avatar updated! 📸" });
    };

    return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message={earnedBadges.length > 0 ? (tDashMascot[2] ?? "Look at all your badges! Keep collecting! 🏅") : (tDashMascot[3] ?? "Complete lessons to start earning badges! 🎯")} size="sm" animation="idle" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lesson-card text-center mb-6">
        <div className="relative w-24 h-24 mx-auto mb-3">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <img src={mascotImg} alt="Profile" className="w-16 h-16 object-contain" />
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-md hover:scale-110 transition-transform">
            <Camera className="w-4 h-4" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </label>
        </div>
        <h2 className="text-xl font-semibold text-foreground">{user.user_metadata?.display_name || user.email?.split("@")[0]}</h2>
        <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
        <div className="inline-flex items-center gap-2 mt-3 bg-secondary rounded-full px-4 py-1.5">
          <span className="text-lg">{levelInfo.current.emoji}</span>
          <span className="font-semibold text-foreground">Level {levelInfo.current.level}</span>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{xp}</div><div className="text-xs text-muted-foreground">{t("general.xp")}</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{streak}</div><div className="text-xs text-muted-foreground">{t("general.streak")}</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{gems}</div><div className="text-xs text-muted-foreground">{t("general.gems")}</div></div>
          <div className="text-center"><div className="text-lg font-semibold text-foreground xp-counter">{earnedBadges.length}</div><div className="text-xs text-muted-foreground">{t("general.badges")}</div></div>
        </div>
      </motion.div>

      {/* Invite code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card text-center mb-6 border-primary/30">
        <p className="text-sm text-muted-foreground mb-1">{t("profile.invite_code")}</p>
        <p className="text-2xl font-mono font-bold text-foreground tracking-widest">{myInviteCode}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("profile.share")}</p>
      </motion.div>

      {/* Leaderboard */}
      <h3 className="text-lg font-semibold text-foreground mb-3">{t("profile.leaderboard")}</h3>
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
                  <span className={`font-medium text-sm ${entry.isUser ? "text-primary" : "text-foreground"}`}>{entry.isUser ? t("general.you") : entry.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{lvl.emoji} {entry.xp} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Friends */}
      <h3 className="text-lg font-semibold text-foreground mb-3">{t("profile.friends")} ({friends.length})</h3>
      {pendingRequests.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">{t("profile.pending")}</p>
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
          <p className="text-sm text-muted-foreground">{t("profile.no_friends")}</p>
        </div>
      )}

      <h3 className="text-lg font-semibold text-foreground mb-3">{t("profile.badges")}</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {BADGE_DEFINITIONS.map((badge, i) => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
              className={`lesson-card text-center py-4 ${!earned ? "opacity-40 grayscale" : ""}`}>
              <span className="text-3xl">{badge.emoji}</span>
              <p className="font-medium text-foreground text-sm mt-2">{badge.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{badge.desc}</p>
              {earned && <span className="inline-block mt-2 text-xs text-primary font-medium">{t("missions.done")}</span>}
            </motion.div>
          );
        })}
      </div>

      <Button variant="outline" onClick={onOpenSettings} className="w-full gap-2 mb-3">
        <SettingsIcon className="w-4 h-4" /> {t("profile.settings")}
      </Button>
      <Button variant="ghost" onClick={onSignOut} className="w-full text-muted-foreground hover:text-destructive gap-2">
        <LogOut className="w-4 h-4" /> {t("profile.sign_out")}
      </Button>
    </>
  );
  };

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
          <Missions stats={missionStats} claimedMissions={claimedMissions} onClaim={handleClaimMission} locale={locale} />
        )}
        {activeTab === "shop" && (
          <GemShop gems={gems} extraLives={extraLives} ownedTitles={ownedTitles} onPurchase={handlePurchase} locale={locale} />
        )}
        {activeTab === "profile" && renderProfile()}
      </main>

      <div className="thumb-bar">
        {[
          { id: "home" as const, icon: Home, label: t("nav.home") },
          { id: "learn" as const, icon: BookOpen, label: t("nav.learn") },
          { id: "missions" as const, icon: Target, label: t("nav.missions") },
          { id: "shop" as const, icon: ShoppingBag, label: t("nav.shop") },
          { id: "profile" as const, icon: UserIcon, label: t("nav.profile") },
        ].map(tab => {
          const Icon = tab.icon;
          const claimableCount = tab.id === "missions"
            ? MISSIONS.filter((mission) => !claimedMissions.includes(mission.id) && mission.requirement(missionStats)).length
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
