import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Pause, X, FileText, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Locale } from "@/lib/i18n";
import { useTranslation } from "@/lib/i18n";

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
  const { t } = useTranslation(locale);
  const { toast } = useToast();

  const [mentorState, setMentorState] = useState<MentorState>("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [mentorResponse, setMentorResponse] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [micPermission, setMicPermission] = useState<"granted" | "denied" | "prompt">("prompt");
  const [showMicPrompt, setShowMicPrompt] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Waveform drawing
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / 40);
    const barGap = 2;

    for (let i = 0; i < 40; i++) {
      const dataIdx = Math.floor(i * bufferLength / 40);
      const barHeight = (dataArray[dataIdx] / 255) * canvas.height * 0.8;
      const x = i * (barWidth + barGap);
      const hue = 200 + (i * 3);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, 0.8)`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
    }
    animFrameRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  // Idle waveform
  const drawIdleWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const time = Date.now() / 1000;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = canvas.width / 40;
    const barGap = 2;
    for (let i = 0; i < 40; i++) {
      const h = 4 + Math.sin(time * 2 + i * 0.3) * 3;
      const x = i * (barWidth + barGap);
      ctx.fillStyle = `hsla(210, 60%, 50%, 0.4)`;
      ctx.fillRect(x, canvas.height / 2 - h / 2, barWidth, h);
    }
    animFrameRef.current = requestAnimationFrame(drawIdleWaveform);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (mentorState === "listening" || mentorState === "speaking") {
      drawWaveform();
    } else {
      drawIdleWaveform();
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isOpen, mentorState, drawWaveform, drawIdleWaveform]);

  // Start mic
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicPermission("granted");

      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtxRef.current.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;

      return true;
    } catch {
      setMicPermission("denied");
      toast({ title: "Microphone access denied", description: "Please enable microphone in your browser settings.", variant: "destructive" });
      return false;
    }
  }, [toast]);

  // Speech recognition
  const startListening = useCallback(async () => {
    if (micPermission === "prompt") {
      setShowMicPrompt(true);
      return;
    }

    const micOk = await startMic();
    if (!micOk) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: "Speech recognition not supported", description: "Please use Chrome or Edge.", variant: "destructive" });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = locale === "zh-CN" ? "zh-CN" : locale === "zh-TW" ? "zh-TW" :
      locale === "ja" ? "ja-JP" : locale === "ko" ? "ko-KR" :
      locale === "fr" ? "fr-FR" : locale === "es" ? "es-ES" :
      locale === "de" ? "de-DE" : locale === "pt" ? "pt-BR" :
      locale === "ar" ? "ar-SA" : "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) setUserTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      setMentorState("idle");
      // Auto-send if we have text
      setUserTranscript(prev => {
        const text = prev.trim();
        if (text) {
          setTimeout(() => sendQuestion(text), 500);
        }
        return prev;
      });
    };

    recognition.onerror = (e: any) => {
      if (e.error !== "no-speech") {
        console.error("Speech error:", e.error);
      }
      setMentorState("idle");
    };

    recognitionRef.current = recognition;
    setUserTranscript("");
    setInterimTranscript("");
    setMentorResponse("");
    setHighlightIndex(-1);
    setMentorState("listening");
    recognition.start();
  }, [micPermission, startMic, locale, toast]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  // Send question to AI
  const sendQuestion = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMentorState("thinking");
    setMentorResponse("");
    setHighlightIndex(-1);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newExchanges = [...exchanges, { speaker: "user" as const, text, time: now }];

    abortRef.current = new AbortController();

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
            conversation_history: exchanges.slice(-6).map(e => ({
              speaker: e.speaker, text: e.text,
            })),
            language: locale,
          }),
          signal: abortRef.current.signal,
        }
      );

      if (!resp.ok || !resp.body) {
        throw new Error("Failed to get response");
      }

      // Stream SSE
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullResponse = "";
      let sentenceBuffer = "";

      setMentorState("speaking");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
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

              // Sentence boundary - speak it
              if (/[.!?。！？]\s?$/.test(sentenceBuffer.trim()) && sentenceBuffer.trim().length > 10) {
                speakSentence(sentenceBuffer.trim());
                sentenceBuffer = "";
              }
            }
          } catch { /* partial json */ }
        }
      }

      // Speak remaining buffer
      if (sentenceBuffer.trim()) {
        speakSentence(sentenceBuffer.trim());
      }

      // Add mentor exchange
      const mentorExchange: Exchange = { speaker: "mentor", text: fullResponse, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const finalExchanges = [...newExchanges, mentorExchange];
      setExchanges(finalExchanges);

      // Save to DB
      if (userId && sessionId) {
        await supabase.from("voice_exchanges" as any).insert({
          session_id: sessionId,
          user_text: text,
          mentor_text: fullResponse,
          exchange_index: Math.floor(finalExchanges.length / 2),
        });
        await supabase.from("voice_sessions" as any).update({
          exchange_count: Math.floor(finalExchanges.length / 2),
        }).eq("id", sessionId);
      }

      // Word highlight animation
      const words = fullResponse.split(/\s+/);
      const wordDuration = Math.max(80, 2000 / words.length);
      words.forEach((_, i) => {
        setTimeout(() => setHighlightIndex(i), i * wordDuration);
      });
      setTimeout(() => {
        setHighlightIndex(-1);
        setMentorState("idle");
      }, words.length * wordDuration + 500);

    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error("Mentor error:", e);
        toast({ title: "Error", description: "Could not get a response. Please try again.", variant: "destructive" });
      }
      setMentorState("idle");
    }
  }, [exchanges, skillTopic, lessonContext, locale, userId, sessionId, toast]);

  // TTS with browser SpeechSynthesis
  const speakSentence = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    // Try to match locale
    const voices = window.speechSynthesis.getVoices();
    const langMap: Record<string, string> = {
      en: "en", fr: "fr", es: "es", "zh-CN": "zh-CN", "zh-TW": "zh-TW",
      de: "de", ja: "ja", ko: "ko", pt: "pt", ar: "ar",
    };
    const targetLang = langMap[locale] || "en";
    const voice = voices.find(v => v.lang.startsWith(targetLang)) || voices[0];
    if (voice) utterance.voice = voice;
    synthRef.current = utterance;

    // Connect to analyser for waveform
    utterance.onstart = () => {
      // Create oscillator-based visualization for TTS output
      if (audioCtxRef.current && analyserRef.current) {
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        gain.gain.value = 0.01;
        osc.connect(gain);
        gain.connect(analyserRef.current);
        osc.start();
        utterance.onend = () => { osc.stop(); };
      }
    };

    window.speechSynthesis.speak(utterance);
  }, [locale]);

  // Create session on open
  useEffect(() => {
    if (isOpen && userId && !sessionId) {
      supabase.from("voice_sessions" as any).insert({
        user_id: userId,
        skill_topic: skillTopic,
        lesson_id: lessonId || null,
      }).select("id").single().then(({ data }) => {
        if (data) setSessionId((data as any).id);
      });
    }
  }, [isOpen, userId, skillTopic, lessonId, sessionId]);

  // Cleanup on close
  const handleClose = useCallback(() => {
    stopListening();
    window.speechSynthesis?.cancel();
    abortRef.current?.abort();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setMentorState("idle");
    setUserTranscript("");
    setInterimTranscript("");
    setMentorResponse("");
    setExchanges([]);
    setSessionId(null);
    setShowTranscript(false);
    onClose();
  }, [stopListening, onClose]);

  const handleMicPromptAccept = useCallback(async () => {
    setShowMicPrompt(false);
    const ok = await startMic();
    if (ok) {
      setMicPermission("granted");
      startListening();
    }
  }, [startMic, startListening]);

  if (!isOpen) return null;

  const responseWords = mentorResponse.split(/\s+/);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

        {/* Panel */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  🎙️ Skill Mentor
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">LIVE</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">Topic: {skillTopic}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleClose} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Mentor Avatar & Waveform */}
          <div className="px-6 py-5 flex flex-col items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-4xl shadow-lg"
                animate={
                  mentorState === "speaking"
                    ? { boxShadow: ["0 0 0 0 hsla(var(--primary), 0.4)", "0 0 0 20px hsla(var(--primary), 0)", "0 0 0 0 hsla(var(--primary), 0.4)"] }
                    : mentorState === "thinking"
                    ? { scale: [1, 1.05, 1] }
                    : {}
                }
                transition={{ duration: mentorState === "speaking" ? 1.5 : 2, repeat: Infinity }}
              >
                🧑‍🏫
              </motion.div>
              {mentorState === "listening" && (
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Mic className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Jordan</p>
              <p className="text-xs text-muted-foreground">Your Life Skills Coach</p>
            </div>

            {/* Waveform */}
            <canvas
              ref={canvasRef}
              width={320}
              height={40}
              className="w-full max-w-[320px] h-10 rounded-lg"
            />

            {/* Status */}
            <div className="h-5">
              {mentorState === "listening" && (
                <motion.p className="text-sm text-primary font-medium flex items-center gap-1" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Mic className="w-3 h-3" /> Listening...
                </motion.p>
              )}
              {mentorState === "thinking" && (
                <motion.p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Jordan is thinking...
                </motion.p>
              )}
              {mentorState === "speaking" && (
                <motion.p className="text-sm text-green-500 flex items-center gap-1">
                  <Volume2 className="w-3 h-3" /> Jordan is speaking...
                </motion.p>
              )}
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto px-6 pb-3 space-y-3 min-h-0 max-h-[30vh]">
            {/* User transcript */}
            {(userTranscript || interimTranscript) && (
              <div className="bg-primary/10 rounded-xl p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">🗣️ You said:</p>
                <p className="text-sm text-foreground">
                  {userTranscript}
                  {interimTranscript && <span className="italic text-muted-foreground">{interimTranscript}</span>}
                </p>
              </div>
            )}

            {/* Mentor response */}
            {mentorResponse && (
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">💬 Jordan:</p>
                <p className="text-sm text-foreground leading-relaxed">
                  {responseWords.map((word, i) => (
                    <span
                      key={i}
                      className={`transition-colors duration-150 ${
                        i === highlightIndex ? "text-primary font-semibold" :
                        i < highlightIndex ? "text-foreground" : "text-foreground/70"
                      }`}
                    >
                      {word}{" "}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-6 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <span>📍 {skillTopic} | 💬 {Math.floor(exchanges.length / 2)} exchanges</span>
            <button onClick={() => setShowTranscript(!showTranscript)} className="flex items-center gap-1 hover:text-foreground transition-colors">
              <FileText className="w-3 h-3" />
              {showTranscript ? "Hide" : "View"} Transcript
            </button>
          </div>

          {/* Transcript Drawer */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                exit={{ height: 0 }}
                className="overflow-hidden border-t border-border"
              >
                <div className="px-6 py-3 max-h-[200px] overflow-y-auto space-y-2 bg-muted/30">
                  {exchanges.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">No exchanges yet. Start talking!</p>
                  )}
                  {exchanges.map((ex, i) => (
                    <div key={i} className="text-xs">
                      <span className="text-muted-foreground">[{ex.time}]</span>{" "}
                      <span className={ex.speaker === "user" ? "text-primary font-medium" : "text-green-500 font-medium"}>
                        {ex.speaker === "user" ? "You" : "Jordan"}:
                      </span>{" "}
                      <span className="text-foreground">{ex.text.slice(0, 200)}{ex.text.length > 200 ? "..." : ""}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-center gap-4">
            <Button
              onClick={mentorState === "listening" ? stopListening : startListening}
              disabled={mentorState === "thinking" || mentorState === "speaking"}
              className={`rounded-full w-14 h-14 ${
                mentorState === "listening"
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
              size="icon"
            >
              {mentorState === "listening" ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                window.speechSynthesis?.cancel();
                abortRef.current?.abort();
                setMentorState("idle");
              }}
              disabled={mentorState === "idle"}
              className="rounded-full"
              size="icon"
            >
              <Pause className="w-5 h-5" />
            </Button>

            <Button
              variant="destructive"
              onClick={handleClose}
              className="rounded-full px-4"
            >
              End Session
            </Button>
          </div>
        </motion.div>

        {/* Mic Permission Prompt */}
        <AnimatePresence>
          {showMicPrompt && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute z-20 bg-card rounded-2xl p-6 shadow-2xl border border-border max-w-sm mx-4"
            >
              <div className="text-center space-y-3">
                <div className="text-4xl">🎤</div>
                <h3 className="font-bold text-foreground">Microphone Access</h3>
                <p className="text-sm text-muted-foreground">
                  To talk with your mentor, we need access to your microphone. Your audio is never stored — only the transcribed text is saved if you choose.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowMicPrompt(false)} className="flex-1">Cancel</Button>
                  <Button onClick={handleMicPromptAccept} className="flex-1">Allow</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceMentorPanel;
