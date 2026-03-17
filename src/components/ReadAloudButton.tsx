import { useState, useRef, useCallback } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";

interface ReadAloudButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md";
}

const ReadAloudButton = ({ text, className = "", size = "sm" }: ReadAloudButtonProps) => {
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const handlePlay = useCallback(async () => {
    if (playing) {
      audioRef.current?.pause();
      audioRef.current = null;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
      setPlaying(false);
      return;
    }

    if (!text?.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: text.slice(0, 5000) }),
        }
      );

      if (!response.ok) throw new Error("TTS failed");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      urlRef.current = audioUrl;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlaying(false);
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      };

      await audio.play();
      setPlaying(true);
    } catch (err) {
      console.error("Read aloud error:", err);
    } finally {
      setLoading(false);
    }
  }, [text, playing]);

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const btnSize = size === "sm" ? "w-7 h-7" : "w-8 h-8";

  return (
    <button
      onClick={handlePlay}
      disabled={loading}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all ${
        playing
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      } ${className}`}
      title={playing ? "Stop reading" : "Read aloud"}
      aria-label={playing ? "Stop reading aloud" : "Read this text aloud"}
    >
      {loading ? (
        <Loader2 className={`${iconSize} animate-spin`} />
      ) : playing ? (
        <Square className={iconSize} />
      ) : (
        <Volume2 className={iconSize} />
      )}
    </button>
  );
};

export default ReadAloudButton;
