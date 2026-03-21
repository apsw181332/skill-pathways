import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/lib/i18n";

// Global translation cache — persists across component mounts
const translationCache: Record<string, string[]> = {};
// Debounce queue to batch translation requests
let translateDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const pendingTranslations: Array<{
  key: string;
  texts: string[];
  locale: string;
  context: string;
  resolve: (result: string[]) => void;
}> = [];

async function flushTranslations() {
  const batch = pendingTranslations.splice(0, pendingTranslations.length);
  if (batch.length === 0) return;

  // Group by locale+context to minimize API calls
  const groups = new Map<string, typeof batch>();
  for (const item of batch) {
    const gKey = `${item.locale}::${item.context}`;
    if (!groups.has(gKey)) groups.set(gKey, []);
    groups.get(gKey)!.push(item);
  }

  for (const [, items] of groups) {
    // Merge all texts into one request
    const allTexts = items.flatMap(i => i.texts);
    const { locale, context } = items[0];

    try {
      const { data, error } = await supabase.functions.invoke("translate-content", {
        body: { texts: allTexts, targetLocale: locale, context },
      });

      if (!error && data?.translations?.length === allTexts.length) {
        let offset = 0;
        for (const item of items) {
          const slice = data.translations.slice(offset, offset + item.texts.length);
          translationCache[item.key] = slice;
          item.resolve(slice);
          offset += item.texts.length;
        }
      } else {
        for (const item of items) item.resolve(item.texts);
      }
    } catch {
      for (const item of items) item.resolve(item.texts);
    }
  }
}

function queueTranslation(key: string, texts: string[], locale: string, context: string): Promise<string[]> {
  return new Promise((resolve) => {
    pendingTranslations.push({ key, texts, locale, context, resolve });
    if (translateDebounceTimer) clearTimeout(translateDebounceTimer);
    translateDebounceTimer = setTimeout(flushTranslations, 50);
  });
}

function stableStringify(texts: string[]): string {
  // Fast hash — avoid JSON.stringify on every render
  let h = "";
  for (let i = 0; i < texts.length; i++) {
    h += texts[i].length + ":" + texts[i].slice(0, 20) + "|";
  }
  return h;
}

export function useTranslatedContent(
  texts: string[],
  locale: Locale,
  context: string = "educational lesson content"
) {
  const [translated, setTranslated] = useState<string[]>(texts);
  const [loading, setLoading] = useState(false);
  const prevHash = useRef("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (locale === "en" || !texts.length) {
      setTranslated(texts);
      return;
    }

    const hash = `${locale}:${context}:${stableStringify(texts)}`;
    if (hash === prevHash.current) return;
    prevHash.current = hash;

    // Check cache synchronously
    if (translationCache[hash]) {
      setTranslated(translationCache[hash]);
      return;
    }

    setLoading(true);
    queueTranslation(hash, texts, locale, context).then((result) => {
      if (mountedRef.current) {
        setTranslated(result);
        setLoading(false);
      }
    });
  }, [texts, locale, context]);

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
