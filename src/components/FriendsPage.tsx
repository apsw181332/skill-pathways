import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Users, Check, X, Search, MessageCircle, Gift, Send,
  ArrowLeft, Diamond, User as UserIcon, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";
import type { Locale } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n";

interface FriendData { id: string; user_id: string; friend_id: string; status: string; }
interface ProfileData { user_id: string; display_name: string | null; xp: number; streak: number; level: number; }
interface ChatMessage { id: string; sender_id: string; receiver_id: string; content: string; gem_gift: number; created_at: string; }

interface FriendsPageProps {
  userId: string;
  gems: number;
  locale?: Locale;
}

const FriendsPage = ({ userId, gems, locale = "en" }: FriendsPageProps) => {
  const { t } = useTranslation(locale);
  const { toast } = useToast();
  const [view, setView] = useState<"list" | "chat">("list");
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendData[]>([]);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, ProfileData>>({});
  const [pendingProfiles, setPendingProfiles] = useState<Record<string, ProfileData>>({});
  const [inviteCode, setInviteCode] = useState("");
  const [addingFriend, setAddingFriend] = useState(false);
  const [myInviteCode, setMyInviteCode] = useState("");
  const [chatFriend, setChatFriend] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [giftAmount, setGiftAmount] = useState(0);

  const refreshSocialData = useCallback(async () => {
    const [sent, received, pending, profileRes] = await Promise.all([
      supabase.from("friendships").select("*").eq("user_id", userId).eq("status", "accepted"),
      supabase.from("friendships").select("*").eq("friend_id", userId).eq("status", "accepted"),
      supabase.from("friendships").select("*").eq("friend_id", userId).eq("status", "pending"),
      supabase.from("profiles").select("friend_code").eq("user_id", userId).single(),
    ]);

    if (profileRes.data) setMyInviteCode((profileRes.data as any).friend_code || "");

    const allFriends = [...(sent.data || []), ...(received.data || [])] as FriendData[];
    const pendingRows = (pending.data || []) as FriendData[];
    setFriends(allFriends);
    setPendingRequests(pendingRows);

    const friendIds = [...new Set(allFriends.map(f => f.user_id === userId ? f.friend_id : f.user_id))];
    const pendingIds = [...new Set(pendingRows.map(r => r.user_id))];

    if (friendIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level").in("user_id", friendIds);
      if (data) {
        const map: Record<string, ProfileData> = {};
        data.forEach(p => { map[p.user_id] = p as ProfileData; });
        setFriendProfiles(map);
      }
    } else setFriendProfiles({});

    if (pendingIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level").in("user_id", pendingIds);
      if (data) {
        const map: Record<string, ProfileData> = {};
        data.forEach(p => { map[p.user_id] = p as ProfileData; });
        setPendingProfiles(map);
      }
    } else setPendingProfiles({});
  }, [userId]);

  useEffect(() => {
    refreshSocialData();
    const channel = supabase.channel(`friends-page-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, (payload) => {
        const row = (payload.new || payload.old) as Partial<FriendData>;
        if (row.user_id === userId || row.friend_id === userId) refreshSocialData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refreshSocialData, userId]);

  // Chat messages
  useEffect(() => {
    if (!chatFriend) { setChatMessages([]); return; }
    const loadMessages = async () => {
      const { data } = await supabase.from("friend_messages")
        .select("*")
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${chatFriend}),and(sender_id.eq.${chatFriend},receiver_id.eq.${userId})`)
        .order("created_at", { ascending: true }).limit(100);
      if (data) setChatMessages(data as ChatMessage[]);
    };
    loadMessages();
    const channel = supabase.channel(`chat-friends-${chatFriend}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "friend_messages" }, (payload) => {
        const msg = payload.new as ChatMessage;
        if ((msg.sender_id === userId && msg.receiver_id === chatFriend) || (msg.sender_id === chatFriend && msg.receiver_id === userId)) {
          setChatMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [chatFriend, userId]);

  const handleAccept = async (id: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", id);
    refreshSocialData();
  };

  const handleReject = async (id: string) => {
    await supabase.from("friendships").update({ status: "rejected" }).eq("id", id);
    refreshSocialData();
  };

  const handleAddFriend = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 8) {
      toast({ title: "Invalid code", description: "Enter a valid 8-character invite code.", variant: "destructive" });
      return;
    }
    setAddingFriend(true);
    const code = inviteCode.trim().toUpperCase();
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").eq("friend_code", code);
    if (!profiles || profiles.length === 0) {
      toast({ title: "User not found", description: "No user matches this invite code.", variant: "destructive" });
      setAddingFriend(false); return;
    }
    const target = profiles[0];
    if (target.user_id === userId) {
      toast({ title: "That's you!", description: "You can't add yourself.", variant: "destructive" });
      setAddingFriend(false); return;
    }
    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(user_id.eq.${userId},friend_id.eq.${target.user_id}),and(user_id.eq.${target.user_id},friend_id.eq.${userId})`);
    if (existing && existing.length > 0) {
      toast({ title: "Already connected", description: "You already have a friendship with this user." });
      setAddingFriend(false); return;
    }
    const { error } = await supabase.from("friendships").insert({ user_id: userId, friend_id: target.user_id, status: "pending" });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Friend request sent! 🤝", description: `Request sent to ${target.display_name || "user"}.` }); setInviteCode(""); refreshSocialData(); }
    setAddingFriend(false);
  };

  const handleSendMessage = async () => {
    if (!chatFriend || (!chatInput.trim() && giftAmount <= 0)) return;
    const { data, error } = await supabase.functions.invoke("friend-send-message", {
      body: { receiver_id: chatFriend, content: chatInput.trim(), gem_gift: giftAmount },
    });
    if (error || data?.error) {
      toast({ title: "Could not send", description: data?.error || error?.message || "Try again.", variant: "destructive" });
      return;
    }
    if (data?.message) setChatMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message as ChatMessage]);
    setChatInput(""); setGiftAmount(0);
  };

  // Chat view
  if (chatFriend) {
    const fProfile = friendProfiles[chatFriend];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => { setChatFriend(null); setView("list"); }} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <UserIcon className="w-5 h-5 text-primary" />
          <span className="font-medium text-foreground">{fProfile?.display_name || "Friend"}</span>
          <span className="text-xs text-muted-foreground ml-auto">{fProfile?.xp || 0} XP</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[50vh]">
          {chatMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">No messages yet. Say hi! 👋</p>
            </div>
          )}
          {chatMessages.map(msg => {
            const isMine = msg.sender_id === userId;
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

        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setGiftAmount(prev => prev > 0 ? 0 : 5)} title="Gift gems">
            <Gift className={`w-4 h-4 ${giftAmount > 0 ? "text-cyan-500" : "text-muted-foreground"}`} />
          </Button>
          {giftAmount > 0 && (
            <Input type="number" min={1} value={giftAmount} onChange={e => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-16 text-center" />
          )}
          <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type a message..."
            className="flex-1" onKeyDown={e => e.key === "Enter" && handleSendMessage()} />
          <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim() && giftAmount <= 0}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message="Connect with friends, chat, and gift gems! 🤝💎" size="sm" animation="wave" />
      </motion.div>

      {/* Add friend */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Add Friend
        </h3>
        <div className="flex gap-2 mb-3">
          <Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Enter invite code..."
            className="flex-1 font-mono" maxLength={8} onKeyDown={e => e.key === "Enter" && handleAddFriend()} />
          <Button size="sm" onClick={handleAddFriend} disabled={addingFriend || inviteCode.length < 8}>
            {addingFriend ? "..." : "Add"}
          </Button>
        </div>
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Your invite code</p>
            <p className="font-mono font-bold text-foreground tracking-widest">{myInviteCode}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            navigator.clipboard.writeText(myInviteCode);
            toast({ title: "Copied! 📋" });
          }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Pending requests */}
      {pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">Pending Requests ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map(req => {
              const profile = pendingProfiles[req.user_id];
              return (
                <div key={req.id} className="lesson-card flex items-center gap-3 py-3">
                  <UserIcon className="w-4 h-4 text-primary" />
                  <span className="flex-1 font-medium text-foreground text-sm">{profile?.display_name || "Anonymous"}</span>
                  <button onClick={() => handleAccept(req.id)} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleReject(req.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Friends list */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Friends ({friends.length})</h3>
      {friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map(friend => {
            const fId = friend.user_id === userId ? friend.friend_id : friend.user_id;
            const profile = friendProfiles[fId];
            return (
              <motion.button key={friend.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setChatFriend(fId)}
                className="lesson-card flex items-center gap-3 py-3 w-full text-left hover:border-primary transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground text-sm">{profile?.display_name || "Anonymous"}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{profile?.xp || 0} XP</span>
                    <span>🔥 {profile?.streak || 0}</span>
                  </div>
                </div>
                <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="lesson-card text-center py-8">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No friends yet. Share your invite code to connect!</p>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;
