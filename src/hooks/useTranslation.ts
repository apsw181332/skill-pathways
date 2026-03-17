import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/lib/i18n";

// Cache translations to avoid repeated API calls
const translationCache: Record<string, string[]> = {};

function getCacheKey(texts: string[], locale: string, context: string): string {
  return JSON.stringify({ locale, context, texts });
}

export function useTranslatedContent(
  texts: string[],
  locale: Locale,
  context: string = "educational lesson content"
) {
  const [translated, setTranslated] = useState<string[]>(texts);
  const [loading, setLoading] = useState(false);
  const prevKey = useRef("");

  useEffect(() => {
    if (locale === "en" || !texts.length) {
      setTranslated(texts);
      return;
    }

    const key = getCacheKey(texts, locale);
    if (key === prevKey.current) return;
    prevKey.current = key;

    // Check cache
    if (translationCache[key]) {
      setTranslated(translationCache[key]);
      return;
    }

    const doTranslate = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("translate-content", {
          body: { texts, targetLocale: locale, context },
        });
        if (!error && data?.translations?.length === texts.length) {
          translationCache[key] = data.translations;
          setTranslated(data.translations);
        } else {
          setTranslated(texts);
        }
      } catch {
        setTranslated(texts);
      }
      setLoading(false);
    };

    doTranslate();
  }, [texts, locale]);

  return { translated, loading };
}

export function useAdaptedContent(
  learningCode: string | null,
  learningStyle: string | null,
  content: string | undefined,
  mascotMsg: string,
  lessonTitle: string
) {
  const [adapted, setAdapted] = useState({ content: content || "", mascotMsg });
  const [loading, setLoading] = useState(false);
  const prevKey = useRef("");

  useEffect(() => {
    if (!learningCode || !content) {
      setAdapted({ content: content || "", mascotMsg });
      return;
    }

    const key = `${learningCode}:${lessonTitle}:${content.slice(0, 50)}`;
    if (key === prevKey.current) return;
    prevKey.current = key;

    const adapt = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke("adapt-lesson", {
          body: { learningCode, learningStyle, lessonTitle, lessonContent: content, mascotMsg },
        });
        if (!error && data?.adapted) {
          setAdapted({ content: data.adapted, mascotMsg: data.adaptedMascotMsg || mascotMsg });
        }
      } catch {
        // Keep original
      }
      setLoading(false);
    };

    adapt();
  }, [learningCode, content, mascotMsg, lessonTitle, learningStyle]);

  return { adapted, loading };
}
