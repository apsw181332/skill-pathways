import { useCallback, useRef } from "react";

const TTS_CACHE = new Map<string, string>();

export function useTTS(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speak = useCallback(async (text: string) => {
    if (!enabled || !text) return;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Truncate very long text
    const truncated = text.slice(0, 500);

    // Check cache
    const cacheKey = truncated.slice(0, 100);
    let audioUrl = TTS_CACHE.get(cacheKey);

    if (!audioUrl) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ text: truncated }),
          }
        );

        if (!response.ok) return;

        const blob = await response.blob();
        audioUrl = URL.createObjectURL(blob);
        TTS_CACHE.set(cacheKey, audioUrl);
      } catch {
        return;
      }
    }

    const audio = new Audio(audioUrl);
    audio.volume = 0.8;
    audioRef.current = audio;
    await audio.play().catch(() => {});
  }, [enabled]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  return { speak, stop };
}
