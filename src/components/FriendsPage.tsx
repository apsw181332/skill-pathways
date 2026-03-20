import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  UserPlus, Users, Check, X, MessageCircle, Gift, Send,
  ArrowLeft, Diamond, User as UserIcon, Copy, Pencil, Undo2, Smile
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";
import type { Locale } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n";
import { useTranslatedContent } from "@/hooks/useTranslation";

interface FriendData { id: string; user_id: string; friend_id: string; status: string; }
interface ProfileData { user_id: string; display_name: string | null; xp: number; streak: number; level: number; avatar_url?: string | null; }
interface ChatMessage { id: string; sender_id: string; receiver_id: string; content: string; gem_gift: number; created_at: string; }

interface FriendsPageProps {
  userId: string;
  gems: number;
  locale?: Locale;
}

const RECALL_WINDOW = 3 * 60 * 1000;

const FriendsPage = ({ userId, gems, locale = "en" }: FriendsPageProps) => {
  const { t } = useTranslation(locale);
  const { toast } = useToast();
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
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [myAvatarUrl, setMyAvatarUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const EMOJI_LIST = ["😀","😂","😍","🥳","😎","🤔","👍","👏","🎉","❤️","🔥","💎","⭐","🎯","💪","🙏","😅","🤣","😊","🥰","😤","😱","🤝","✨","🌟","💖","🫡","😏"];

  // Translate static UI strings
  const uiTexts = useMemo(() => [
    "Connect with friends, chat, and gift gems! 🤝💎",
    "Add Friend", "Enter invite code...", "Add", "Your invite code", "Copied! 📋",
    "Pending Requests", "No friends yet. Share your invite code to connect!",
    "Friends", "No messages yet. Say hi! 👋", "Type a message...",
    "gems gifted", "Message recalled", "(edited)"
  ], []);
  const { translated: tUi } = useTranslatedContent(uiTexts, locale, "friends page UI");

  const refreshSocialData = useCallback(async () => {
    const [sent, received, pending, profileRes] = await Promise.all([
      supabase.from("friendships").select("*").eq("user_id", userId).eq("status", "accepted"),
      supabase.from("friendships").select("*").eq("friend_id", userId).eq("status", "accepted"),
      supabase.from("friendships").select("*").eq("friend_id", userId).eq("status", "pending"),
      supabase.from("profiles").select("friend_code, avatar_url").eq("user_id", userId).single(),
    ]);
    if (profileRes.data) {
      setMyInviteCode((profileRes.data as any).friend_code || "");
      setMyAvatarUrl((profileRes.data as any).avatar_url || null);
    }
    const allFriends = [...(sent.data || []), ...(received.data || [])] as FriendData[];
    const pendingRows = (pending.data || []) as FriendData[];
    setFriends(allFriends);
    setPendingRequests(pendingRows);
    const friendIds = [...new Set(allFriends.map(f => f.user_id === userId ? f.friend_id : f.user_id))];
    const pendingIds = [...new Set(pendingRows.map(r => r.user_id))];
    if (friendIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level, avatar_url").in("user_id", friendIds);
      if (data) { const map: Record<string, ProfileData> = {}; data.forEach(p => { map[p.user_id] = p as ProfileData; }); setFriendProfiles(map); }
    } else setFriendProfiles({});
    if (pendingIds.length > 0) {
      const { data } = await supabase.from("profiles").select("user_id, display_name, xp, streak, level, avatar_url").in("user_id", pendingIds);
      if (data) { const map: Record<string, ProfileData> = {}; data.forEach(p => { map[p.user_id] = p as ProfileData; }); setPendingProfiles(map); }
    } else setPendingProfiles({});
    // Load nicknames from localStorage
    try {
      const saved = localStorage.getItem(`nicknames-${userId}`);
      if (saved) setNicknames(JSON.parse(saved));
    } catch {}
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

  const handleAccept = async (id: string) => { await supabase.from("friendships").update({ status: "accepted" }).eq("id", id); refreshSocialData(); };
  const handleReject = async (id: string) => { await supabase.from("friendships").update({ status: "rejected" }).eq("id", id); refreshSocialData(); };

  const handleAddFriend = async () => {
    if (!inviteCode.trim() || inviteCode.trim().length < 8) { toast({ title: "Invalid code", variant: "destructive" }); return; }
    setAddingFriend(true);
    const code = inviteCode.trim().toUpperCase();
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").eq("friend_code", code);
    if (!profiles?.length) { toast({ title: "User not found", variant: "destructive" }); setAddingFriend(false); return; }
    const target = profiles[0];
    if (target.user_id === userId) { toast({ title: "That's you!", variant: "destructive" }); setAddingFriend(false); return; }
    const { data: existing } = await supabase.from("friendships").select("id")
      .or(`and(user_id.eq.${userId},friend_id.eq.${target.user_id}),and(user_id.eq.${target.user_id},friend_id.eq.${userId})`);
    if (existing?.length) { toast({ title: "Already connected or request pending" }); setAddingFriend(false); return; }
    // Send a pending friend request — the target must accept it
    const { error } = await supabase.from("friendships").insert({ user_id: userId, friend_id: target.user_id, status: "pending" });
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `Friend request sent to ${target.display_name || "user"}! They need to accept it. 🤝` }); setInviteCode(""); refreshSocialData(); }
    setAddingFriend(false);
  };

  const getFriendDisplayName = (friendUserId: string) => {
    if (nicknames[friendUserId]) return nicknames[friendUserId];
    return friendProfiles[friendUserId]?.display_name || "Friend";
  };

  const saveNickname = (friendUserId: string) => {
    const trimmed = nicknameInput.trim();
    const updated = { ...nicknames };
    if (trimmed) updated[friendUserId] = trimmed;
    else delete updated[friendUserId];
    setNicknames(updated);
    localStorage.setItem(`nicknames-${userId}`, JSON.stringify(updated));
    setEditingNickname(null);
    setNicknameInput("");
    toast({ title: trimmed ? "Nickname saved!" : "Nickname removed" });
  };

  const AvatarBubble = ({ url, name, size = "w-8 h-8" }: { url?: string | null; name: string; size?: string }) => (
    <div className={`${size} rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden`}>
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-xs font-bold text-primary">{(name || "?")[0].toUpperCase()}</span>
      )}
    </div>
  );

  const handleSendMessage = async () => {
    if (!chatFriend || (!chatInput.trim() && giftAmount <= 0)) return;
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`, sender_id: userId, receiver_id: chatFriend,
      content: chatInput.trim() || `Sent you ${giftAmount} gems! 💎`,
      gem_gift: giftAmount, created_at: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    const savedInput = chatInput.trim();
    const savedGift = giftAmount;
    setChatInput(""); setGiftAmount(0);

    const { data, error } = await supabase.functions.invoke("friend-send-message", {
      body: { receiver_id: chatFriend, content: savedInput, gem_gift: savedGift },
    });
    if (error || data?.error) {
      setChatMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      toast({ title: "Could not send", description: data?.error || error?.message, variant: "destructive" });
      return;
    }
    if (data?.message) setChatMessages(prev => prev.map(m => m.id === optimisticMsg.id ? (data.message as ChatMessage) : m));
  };

  const canRecall = (msg: ChatMessage) => msg.sender_id === userId && (Date.now() - new Date(msg.created_at).getTime()) < RECALL_WINDOW && !msg.content.startsWith("Message recalled");
  const canEditMsg = (msg: ChatMessage) => canRecall(msg) && msg.gem_gift === 0;

  const handleRecallMsg = (msgId: string) => {
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: tUi[12] || "Message recalled" } : m));
  };

  const handleEditConfirm = (msgId: string) => {
    if (!editText.trim()) return;
    setChatMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editText.trim() + " " + (tUi[13] || "(edited)") } : m));
    setEditingMsgId(null); setEditText("");
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  if (chatFriend) {
    const fProfile = friendProfiles[chatFriend];
    const friendName = getFriendDisplayName(chatFriend);
    return (
      <div className="flex flex-col h-[calc(100vh-140px)]">
        {/* Fixed header */}
        <div className="flex items-center gap-3 mb-2 shrink-0">
          <button onClick={() => setChatFriend(null)} className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <AvatarBubble url={fProfile?.avatar_url} name={friendName} />
          <div className="flex-1 min-w-0">
            <span className="font-medium text-foreground block truncate">{friendName}</span>
            {nicknames[chatFriend] && <span className="text-xs text-muted-foreground">({fProfile?.display_name})</span>}
          </div>
          <button onClick={() => { setEditingNickname(chatFriend); setNicknameInput(nicknames[chatFriend] || ""); }} className="p-1.5 rounded-lg hover:bg-secondary"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
          <span className="text-xs text-muted-foreground">{fProfile?.xp || 0} XP</span>
        </div>
        {editingNickname === chatFriend && (
          <div className="flex gap-2 mb-2 p-3 rounded-lg bg-secondary/50 shrink-0">
            <Input value={nicknameInput} onChange={e => setNicknameInput(e.target.value)} placeholder="Set a nickname..." className="flex-1" onKeyDown={e => e.key === "Enter" && saveNickname(chatFriend)} />
            <Button size="sm" onClick={() => saveNickname(chatFriend)}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditingNickname(null)}>Cancel</Button>
          </div>
        )}
        {/* Scrollable chat history */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
          {chatMessages.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm">{tUi[9]}</p>
            </div>
          )}
          {chatMessages.map(msg => {
            const isMine = msg.sender_id === userId;
            const isRecalled = msg.content.startsWith("Message recalled");
            const senderAvatar = isMine ? myAvatarUrl : fProfile?.avatar_url;
            const senderName = isMine ? "You" : friendName;
            return (
              <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} gap-2 group`}>
                {!isMine && <AvatarBubble url={senderAvatar} name={senderName} size="w-6 h-6" />}
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm relative ${
                  isRecalled ? "bg-muted text-muted-foreground italic" :
                  isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                }`}>
                  {msg.gem_gift > 0 && !isRecalled && (
                    <div className={`flex items-center gap-1 mb-1 text-xs font-medium ${isMine ? "text-primary-foreground/80" : "text-cyan-500"}`}>
                      <Diamond className="w-3 h-3" /> {msg.gem_gift} {tUi[11]}
                    </div>
                  )}
                  {editingMsgId === msg.id ? (
                    <div className="flex items-center gap-1">
                      <input value={editText} onChange={e => setEditText(e.target.value)} className="bg-transparent border-b border-primary-foreground/50 text-sm w-full outline-none" onKeyDown={e => e.key === "Enter" && handleEditConfirm(msg.id)} autoFocus />
                      <button onClick={() => handleEditConfirm(msg.id)} className="shrink-0"><Check className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : msg.content}
                  <div className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {isMine && !isRecalled && !editingMsgId && (
                    <div className="absolute -top-5 right-0 hidden group-hover:flex gap-1 bg-card border border-border rounded-lg shadow-sm px-1 py-0.5">
                      {canEditMsg(msg) && <button onClick={() => { setEditingMsgId(msg.id); setEditText(msg.content); }} className="p-0.5 hover:text-primary"><Pencil className="w-3 h-3" /></button>}
                      {canRecall(msg) && <button onClick={() => handleRecallMsg(msg.id)} className="p-0.5 hover:text-destructive"><Undo2 className="w-3 h-3" /></button>}
                    </div>
                  )}
                </div>
                {isMine && <AvatarBubble url={senderAvatar} name={senderName} size="w-6 h-6" />}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        {/* Emoji picker */}
        {showEmojiPicker && (
          <div className="shrink-0 bg-secondary/80 rounded-xl p-2 mt-2 grid grid-cols-7 gap-1.5 max-h-32 overflow-y-auto">
            {EMOJI_LIST.map(emoji => (
              <button key={emoji} onClick={() => { setChatInput(prev => prev + emoji); setShowEmojiPicker(false); }}
                className="text-xl hover:scale-125 transition-transform p-1 rounded hover:bg-primary/10">
                {emoji}
              </button>
            ))}
          </div>
        )}
        {/* Fixed input bar */}
        <div className="flex items-center gap-2 mt-2 pt-3 border-t border-border shrink-0">
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setGiftAmount(prev => prev > 0 ? 0 : 5)}>
            <Gift className={`w-4 h-4 ${giftAmount > 0 ? "text-cyan-500" : "text-muted-foreground"}`} />
          </Button>
          {giftAmount > 0 && <Input type="number" min={1} value={giftAmount} onChange={e => setGiftAmount(Math.max(1, parseInt(e.target.value) || 0))} className="w-16 text-center" />}
          <Button variant="outline" size="icon" className="shrink-0" onClick={() => setShowEmojiPicker(prev => !prev)}>
            <Smile className={`w-4 h-4 ${showEmojiPicker ? "text-primary" : "text-muted-foreground"}`} />
          </Button>
          <Input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={tUi[10]} className="flex-1" onKeyDown={e => e.key === "Enter" && handleSendMessage()} />
          <Button size="icon" onClick={handleSendMessage} disabled={!chatInput.trim() && giftAmount <= 0}><Send className="w-4 h-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message={tUi[0]} size="sm" animation="wave" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> {tUi[1]}
        </h3>
        <div className="flex gap-2 mb-3">
          <Input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder={tUi[2]}
            className="flex-1 font-mono" maxLength={8} onKeyDown={e => e.key === "Enter" && handleAddFriend()} />
          <Button size="sm" onClick={handleAddFriend} disabled={addingFriend || inviteCode.length < 8}>{addingFriend ? "..." : tUi[3]}</Button>
        </div>
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">{tUi[4]}</p>
            <p className="font-mono font-bold text-foreground tracking-widest">{myInviteCode}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { navigator.clipboard.writeText(myInviteCode); toast({ title: tUi[5] }); }}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
      {pendingRequests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">{tUi[6]} ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map(req => {
              const profile = pendingProfiles[req.user_id];
              return (
                <div key={req.id} className="lesson-card flex items-center gap-3 py-3">
                  <UserIcon className="w-4 h-4 text-primary" />
                  <span className="flex-1 font-medium text-foreground text-sm">{profile?.display_name || "Anonymous"}</span>
                  <button onClick={() => handleAccept(req.id)} className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20"><Check className="w-4 h-4" /></button>
                  <button onClick={() => handleReject(req.id)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive hover:bg-destructive/20"><X className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
      <h3 className="text-sm font-semibold text-foreground mb-3">{tUi[8]} ({friends.length})</h3>
      {friends.length > 0 ? (
        <div className="space-y-2">
          {friends.map(friend => {
            const fId = friend.user_id === userId ? friend.friend_id : friend.user_id;
            const profile = friendProfiles[fId];
            const displayName = getFriendDisplayName(fId);
            return (
              <motion.button key={friend.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setChatFriend(fId)} className="lesson-card flex items-center gap-3 py-3 w-full text-left hover:border-primary transition-colors">
                <AvatarBubble url={profile?.avatar_url} name={displayName} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-foreground text-sm">{displayName}</span>
                  {nicknames[fId] && <span className="text-xs text-muted-foreground ml-1">({profile?.display_name})</span>}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground"><span>{profile?.xp || 0} XP</span><span>🔥 {profile?.streak || 0}</span></div>
                </div>
                <MessageCircle className="w-4 h-4 text-primary shrink-0" />
              </motion.button>
            );
          })}
        </div>
      ) : (
        <div className="lesson-card text-center py-8">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">{tUi[7]}</p>
        </div>
      )}
    </div>
  );
};

export default FriendsPage;