import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Pencil, Undo2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import mascotImg from "@/assets/mascot-penguin.png";

type Msg = { role: "user" | "assistant"; content: string; id: string; sentAt: number; edited?: boolean; recalled?: boolean };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
let msgCounter = 0;
const genId = () => `msg-${++msgCounter}-${Date.now()}`;
const RECALL_EDIT_WINDOW = 3 * 60 * 1000;

const ChatBot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hey there! I'm Pebble 🐧 Ask me anything about courses, lessons, or how to use Pathways!", id: genId(), sentAt: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const canRecallOrEdit = (msg: Msg) => msg.role === "user" && !msg.recalled && (Date.now() - msg.sentAt) < RECALL_EDIT_WINDOW;

  const handleRecall = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: "Message recalled", recalled: true } : m));
  };

  const startEdit = (msg: Msg) => { setEditingId(msg.id); setEditText(msg.content); };

  const confirmEdit = () => {
    if (!editingId || !editText.trim()) return;
    setMessages(prev => prev.map(m => m.id === editingId ? { ...m, content: editText.trim(), edited: true } : m));
    setEditingId(null); setEditText("");
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim(), id: genId(), sentAt: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";
    const apiMessages = newMessages.filter(m => !m.recalled).map(m => ({ role: m.role, content: m.content }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Something went wrong" }));
        setMessages(prev => [...prev, { role: "assistant", content: err.error || "Oops! Try again! 🐧", id: genId(), sentAt: Date.now() }]);
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      const assistantId = genId();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "" || !line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              const cur = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.id === assistantId) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: cur } : m);
                }
                return [...prev, { role: "assistant", content: cur, id: assistantId, sentAt: Date.now() }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Oops! Connection issue. Try again! 🐧", id: genId(), sentAt: Date.now() }]);
    }
    setLoading(false);
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-24 right-4 z-50 w-14 h-14 rounded-full bg-primary shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Chat with Pebble">
            <img src={mascotImg} alt="Pebble" className="w-9 h-9 object-contain" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-3 z-50 w-[340px] max-h-[480px] bg-card border-2 border-border rounded-2xl shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
              <img src={mascotImg} alt="Pebble" className="w-8 h-8 object-contain" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm">Pebble</h3>
                <p className="text-xs text-muted-foreground">Your learning buddy</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[340px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm relative ${
                    msg.recalled ? "bg-muted text-muted-foreground italic" :
                    msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"
                  }`}>
                    {editingId === msg.id ? (
                      <div className="flex items-center gap-1">
                        <input value={editText} onChange={e => setEditText(e.target.value)} className="bg-transparent border-b border-primary-foreground/50 text-sm w-full outline-none" onKeyDown={e => e.key === "Enter" && confirmEdit()} autoFocus />
                        <button onClick={confirmEdit} className="shrink-0"><Check className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <>{msg.content}{msg.edited && !msg.recalled && <span className="text-[10px] opacity-60 ml-1">(edited)</span>}</>
                    )}
                    {canRecallOrEdit(msg) && !editingId && (
                      <div className="absolute -top-5 right-0 hidden group-hover:flex gap-1 bg-card border border-border rounded-lg shadow-sm px-1 py-0.5">
                        <button onClick={() => startEdit(msg)} className="p-0.5 hover:text-primary" title="Edit"><Pencil className="w-3 h-3" /></button>
                        <button onClick={() => handleRecall(msg.id)} className="p-0.5 hover:text-destructive" title="Recall"><Undo2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-secondary rounded-2xl rounded-bl-sm px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 px-3 py-2 border-t border-border">
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Pebble..." className="flex-1 text-sm h-9" disabled={loading} />
              <Button type="submit" size="sm" disabled={!input.trim() || loading} className="h-9 w-9 p-0"><Send className="w-4 h-4" /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
