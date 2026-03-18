import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot-penguin.png";
import type { Locale } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

interface TranslationLoaderProps {
  locale: Locale;
  onReady: () => void;
  children: React.ReactNode;
}

/**
 * After login, if locale is not English, shows a branded loading screen
 * while pre-loading all UI translations. This prevents users seeing
 * English strings flash before translations load.
 */
const TranslationLoader = ({ locale, onReady, children }: TranslationLoaderProps) => {
  const [isLoading, setIsLoading] = useState(locale !== "en");

  useEffect(() => {
    if (locale === "en") {
      setIsLoading(false);
      onReady();
      return;
    }

    // Pre-translate common UI strings
    const preload = async () => {
      try {
        // Fire a batch translation for course names and common strings
        const { COURSES } = await import("@/lib/courseData");
        const courseTexts = COURSES.flatMap(c => [c.label, c.description]);

        await supabase.functions.invoke("translate-content", {
          body: { texts: courseTexts, targetLocale: locale, context: "course names and descriptions" },
        });
      } catch {
        // Silently fail — user will see English as fallback
      }
      // Give a minimum 800ms so the transition doesn't flash
      setTimeout(() => {
        setIsLoading(false);
        onReady();
      }, 800);
    };

    preload();
  }, [locale]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <motion.img
          src={mascotImg}
          alt="Preparing"
          className="w-20 h-20 object-contain"
          animate={{ y: [0, -10, 0], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="text-center">
          <motion.p
            className="text-lg font-semibold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Preparing your experience...
          </motion.p>
          <motion.p
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Translating content
          </motion.p>
        </div>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default TranslationLoader;
