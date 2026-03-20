import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Volume2, Loader2, Mic, Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Locale } from "@/lib/i18n";

interface VoiceMentorPanelProps {
  isOpen: boolean;
  onClose: () => void;
  skillTopic?: string;
  lessonContext?: string;
  lessonId?: string;
  userId?: string;
  locale?: Locale;
}

interface Exchange {
  speaker: "user" | "mentor";
  text: string;
  time: string;
}

type MentorState = "idle" | "listening" | "thinking" | "speaking";

const VoiceMentorPanel = ({
  isOpen, onClose, skillTopic = "Life Skills", lessonContext = "",
  lessonId, userId, locale = "en",
}: VoiceMentorPanelProps) => {
  const { toast } = useToast();

  const [mentorState, setMentorState] = useState<MentorState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [mentorResponse, setMentorResponse] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsQueueRef = useRef<string[]>([]);
  const isPlayingRef = useRef(false);
  const exchangesRef = useRef<Exchange[]>([]);
  const bargeInActiveRef = useRef(false);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Keep exchangesRef in sync
  useEffect(() => { exchangesRef.current = exchanges; }, [exchanges]);

  const getRecognitionLang = () => {
    const map: Record<string, string> = {
      en: "en-US", fr: "fr-FR", es: "es-ES", "zh-CN": "zh-CN", "zh-TW": "zh-TW",
      de: "de-DE", ja: "ja-JP", ko: "ko-KR", pt: "pt-BR", ar: "ar-SA",
    };
    return map[locale] || "en-US";
  };

  // ──── Waveform ────
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufLen);
    analyser.getByteFrequencyData(data);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 48;
    const totalW = canvas.width;
    const barW = totalW / bars - 2;
    const centerY = canvas.height / 2;

    for (let i = 0; i < bars; i++) {
      const idx = Math.floor(i * bufLen / bars);
      const val = data[idx] / 255;
      const h = Math.max(2, val * canvas.height * 0.85);
      const x = i * (barW + 2);
      const hue = mentorState === "speaking" ? 145 + i * 2 : mentorState === "listening" ? 210 + i * 2 : 220;
      const alpha = 0.4 + val * 0.6;
      ctx.fillStyle = `hsla(${hue}, 75%, 55%, ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(x, centerY - h / 2, barW, h, barW / 2);
      ctx.fill();
    }
    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, [mentorState]);

  const drawIdleWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const t = Date.now() / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bars = 48;
    const barW = canvas.width / bars - 2;
    const cy = canvas.height / 2;
    for (let i = 0; i < bars; i++) {
      const h = 3 + Math.sin(t * 1.5 + i * 0.25) * 2.5;
      const x = i * (barW + 2);
      ctx.fillStyle = `hsla(220, 50%, 45%, 0.3)`;
      ctx.beginPath();
      ctx.roundRect(x, cy - h / 2, barW, h, barW / 2);
      ctx.fill();
    }
    animFrameRef.current = requestAnimationFrame(drawIdleWaveform);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    cancelAnimationFrame(animFrameRef.current);
    if (mentorState === "listening" || mentorState === "speaking") {
      drawWaveform();
    } else {
      drawIdleWaveform();
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isOpen, mentorState, drawWaveform, drawIdleWaveform]);

  // ──── Mic setup ────
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      const src = audioCtxRef.current.createMediaStreamSource(stream);
      src.connect(analyser);
      analyserRef.current = analyser;
      return true;
    } catch {
      toast({ title: "Microphone access denied", description: "Please enable microphone in your browser settings.", variant: "destructive" });
      return false;
    }
  }, [toast]);


  // ──── TTS via ElevenLabs edge function ────
  // Use "Callum" voice (young male) — ID: N2lVS1w4EtoT3dr4eOWO
  const speakWithElevenLabs = useCallback(async (text: string) => {
    try {
      // Read speed from localStorage settings
      const speed = parseFloat(localStorage.getItem("pebble_tts_speed") || "1.0");
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, voiceId: "e79twtVS2278lVZZQiAD", speed }),
        }
      );
      if (!resp.ok) throw new Error("TTS failed");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      return url;
    } catch (e) {
      console.error("ElevenLabs TTS error:", e);
      return null;
    }
  }, []);

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || ttsQueueRef.current.length === 0) return;
    isPlayingRef.current = true;

    while (ttsQueueRef.current.length > 0) {
      if (bargeInActiveRef.current) break;
      const text = ttsQueueRef.current.shift()!;
      const audioUrl = await speakWithElevenLabs(text);
      if (!audioUrl || bargeInActiveRef.current) break;

      await new Promise<void>((resolve) => {
        const audio = new Audio(audioUrl);
        currentAudioRef.current = audio;

        // Connect to analyser for waveform vis
        if (audioCtxRef.current && analyserRef.current) {
          try {
            const src = audioCtxRef.current.createMediaElementSource(audio);
            src.connect(analyserRef.current);
            src.connect(audioCtxRef.current.destination);
            sourceNodeRef.current = src;
          } catch {
            // already connected
          }
        }

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          sourceNodeRef.current = null;
          resolve();
        };
        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          sourceNodeRef.current = null;
          resolve();
        };
        audio.play().catch(() => resolve());
      });
    }

    isPlayingRef.current = false;
    if (!bargeInActiveRef.current) {
      // After AI finishes speaking, auto-listen again
      setMentorState("idle");
      setTimeout(() => startListeningInternal(), 300);
    }
  }, [speakWithElevenLabs]);

  const stopAllAudio = useCallback(() => {
    ttsQueueRef.current = [];
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    sourceNodeRef.current = null;
    isPlayingRef.current = false;
    abortRef.current?.abort();
  }, []);

  // ──── Speech Recognition ────
  const startListeningInternal = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getRecognitionLang();

    let finalText = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setUserTranscript(finalText);
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      const text = finalText.trim();
      if (text) {
        bargeInActiveRef.current = false;
        sendQuestion(text);
      } else {
        // No speech detected — restart listening
        setMentorState("listening");
        setTimeout(() => startListeningInternal(), 200);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") {
        // Restart
        setTimeout(() => startListeningInternal(), 300);
        return;
      }
      console.error("Speech error:", e.error);
      setMentorState("idle");
    };

    recognitionRef.current = recognition;
    setUserTranscript("");
    setInterimTranscript("");
    setMentorState("listening");
    recognition.start();
  }, [locale]);

  // ──── Manual interrupt button ────
  const handleInterrupt = useCallback(() => {
    if (mentorState !== "speaking") return;
    bargeInActiveRef.current = true;
    stopAllAudio();
    startListeningInternal();
  }, [mentorState, stopAllAudio]);


  const sendQuestion = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMentorState("thinking");
    setMentorResponse("");
    setHighlightIndex(-1);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const currentExchanges = exchangesRef.current;
    const newExchanges = [...currentExchanges, { speaker: "user" as const, text, time: now }];

    abortRef.current = new AbortController();
    bargeInActiveRef.current = false;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/voice-mentor-query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            question: text,
            skill_topic: skillTopic,
            lesson_context: lessonContext,
            conversation_history: currentExchanges.slice(-6).map(e => ({ speaker: e.speaker, text: e.text })),
            language: locale,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok || !resp.body) throw new Error("Failed to get response");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      let sentenceBuffer = "";

      setMentorState("speaking");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (bargeInActiveRef.current) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullResponse += content;
              sentenceBuffer += content;
              setMentorResponse(fullResponse);

              if (/[.!?。！？]\s?$/.test(sentenceBuffer.trim()) && sentenceBuffer.trim().length > 10) {
                ttsQueueRef.current.push(sentenceBuffer.trim());
                sentenceBuffer = "";
                playAudioQueue();
              }
            }
          } catch {}
        }
      }

      if (sentenceBuffer.trim() && !bargeInActiveRef.current) {
        ttsQueueRef.current.push(sentenceBuffer.trim());
        playAudioQueue();
      }

      const mentorExchange: Exchange = {
        speaker: "mentor", text: fullResponse,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      const finalExchanges = [...newExchanges, mentorExchange];
      setExchanges(finalExchanges);

      if (userId && sessionId) {
        await supabase.from("voice_exchanges" as any).insert({
          session_id: sessionId, user_text: text, mentor_text: fullResponse,
          exchange_index: Math.floor(finalExchanges.length / 2),
        });
        await supabase.from("voice_sessions" as any).update({
          exchange_count: Math.floor(finalExchanges.length / 2),
        }).eq("id", sessionId);
      }

      // Word highlight
      const words = fullResponse.split(/\s+/);
      const wd = Math.max(80, 2000 / words.length);
      words.forEach((_, i) => setTimeout(() => setHighlightIndex(i), i * wd));
      setTimeout(() => setHighlightIndex(-1), words.length * wd + 500);

    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Mentor error:", e);
        toast({ title: "Error", description: "Could not get a response.", variant: "destructive" });
      }
      setMentorState("idle");
    }
  }, [skillTopic, lessonContext, locale, userId, sessionId, toast, playAudioQueue]);

  // ──── Auto-start on open ────
  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      const ok = await startMic();
      if (ok) {
        setTimeout(() => startListeningInternal(), 500);
      }
    };
    init();

    // Cleanup when panel closes
    return () => {
      if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
      stopAllAudio();
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch {} audioCtxRef.current = null; }
      analyserRef.current = null;
    };
  }, [isOpen]);

  // Create session on open
  useEffect(() => {
    if (isOpen && userId && !sessionId) {
      supabase.from("voice_sessions" as any).insert({
        user_id: userId, skill_topic: skillTopic, lesson_id: lessonId || null,
      }).select("id").single().then(({ data }) => {
        if (data) setSessionId((data as any).id);
      });
    }
  }, [isOpen, userId, skillTopic, lessonId, sessionId]);

  // Cleanup
  const handleClose = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    stopAllAudio();
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setMentorState("idle");
    setUserTranscript("");
    setInterimTranscript("");
    setMentorResponse("");
    setExchanges([]);
    setSessionId(null);
    setShowTranscript(false);
    onClose();
  }, [stopAllAudio, onClose]);

  if (!isOpen) return null;

  const responseWords = mentorResponse.split(/\s+/).filter(Boolean);

  const stateColor = mentorState === "listening" ? "from-blue-500/20 to-cyan-500/10"
    : mentorState === "speaking" ? "from-emerald-500/20 to-green-500/10"
    : mentorState === "thinking" ? "from-amber-500/20 to-yellow-500/10"
    : "from-primary/10 to-primary/5";

  const avatarGlow = mentorState === "speaking" ? "shadow-[0_0_30px_rgba(34,197,94,0.4)]"
    : mentorState === "listening" ? "shadow-[0_0_30px_rgba(59,130,246,0.4)]"
    : mentorState === "thinking" ? "shadow-[0_0_20px_rgba(245,158,11,0.3)]"
    : "shadow-lg";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border overflow-hidden max-h-[85vh] flex flex-col"
        >
          {/* Header */}
          <div className={`px-5 py-4 bg-gradient-to-r ${stateColor} transition-colors duration-500`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <div>
                  <h2 className="text-base font-bold text-foreground">Ask Pebble</h2>
                  <p className="text-xs text-muted-foreground">{skillTopic}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Avatar + Waveform */}
          <div className="px-5 py-6 flex flex-col items-center gap-4">
            <motion.div
              className={`w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-5xl ${avatarGlow} transition-shadow duration-500`}
              animate={
                mentorState === "speaking" ? { scale: [1, 1.08, 1] } :
                mentorState === "thinking" ? { rotate: [0, 8, -8, 0] } : {}
              }
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              🐧
            </motion.div>

            <div className="text-center">
              <p className="font-semibold text-foreground">Pebble</p>
              <div className="h-5 mt-1">
                {mentorState === "listening" && (
                  <motion.p className="text-xs text-blue-400 flex items-center justify-center gap-1" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                    <Mic className="w-3 h-3" /> Listening — just speak...
                  </motion.p>
                )}
                {mentorState === "thinking" && (
                  <p className="text-xs text-amber-400 flex items-center justify-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" /> Pebble is thinking...
                  </p>
                )}
                {mentorState === "speaking" && (
                  <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
                    <Volume2 className="w-3 h-3" /> Pebble is speaking...
                  </p>
                )}
                {mentorState === "idle" && (
                  <p className="text-xs text-muted-foreground">Ready to listen</p>
                )}
              </div>
            </div>

            {/* Waveform */}
            <canvas ref={canvasRef} width={380} height={50} className="w-full max-w-[380px] h-[50px] rounded-xl" />
          </div>

          {/* Conversation */}
          <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-3 min-h-0 max-h-[28vh]">
            {(userTranscript || interimTranscript) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-500/10 rounded-2xl p-3 border border-blue-500/20">
                <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1">You</p>
                <p className="text-sm text-foreground">
                  {userTranscript}
                  {interimTranscript && <span className="text-muted-foreground italic"> {interimTranscript}</span>}
                </p>
              </motion.div>
            )}

            {mentorResponse && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-500/10 rounded-2xl p-3 border border-emerald-500/20">
                <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">🐧 Pebble</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {responseWords.map((word, i) => (
                    <span key={i} className={`transition-colors duration-150 ${
                      i === highlightIndex ? "text-primary font-semibold" :
                      i < highlightIndex ? "text-foreground" : "text-foreground/70"
                    }`}>{word} </span>
                  ))}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">💬 {Math.floor(exchanges.length / 2)} exchanges</span>
            <div className="flex items-center gap-2">
              {mentorState === "speaking" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInterrupt}
                  className="rounded-full text-xs h-7 px-3 border-amber-500/50 text-amber-500 hover:bg-amber-500/10 animate-pulse"
                >
                  <Hand className="w-3 h-3 mr-1" /> Interrupt
                </Button>
              )}
              <button onClick={() => setShowTranscript(!showTranscript)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <FileText className="w-3 h-3" /> Transcript
              </button>
              <Button variant="destructive" size="sm" onClick={handleClose} className="rounded-full text-xs h-7 px-3">
                End
              </Button>
            </div>
          </div>

          {/* Transcript Drawer */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border">
                <div className="px-5 py-3 max-h-[180px] overflow-y-auto space-y-2 bg-muted/20">
                  {exchanges.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">No exchanges yet</p>}
                  {exchanges.map((ex, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-muted-foreground">[{ex.time}]</span>{" "}
                      <span className={ex.speaker === "user" ? "text-blue-400" : "text-emerald-400"}>
                        {ex.speaker === "user" ? "You" : "Pebble"}:
                      </span>{" "}
                      <span className="text-foreground">{ex.text.slice(0, 200)}{ex.text.length > 200 ? "..." : ""}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceMentorPanel;
