import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";
import VoiceMentorPanel from "./VoiceMentorPanel";
import type { Locale } from "@/lib/i18n";

interface VoiceMentorFABProps {
  skillTopic?: string;
  lessonContext?: string;
  lessonId?: string;
  userId?: string;
  locale?: Locale;
}

const VoiceMentorFAB = ({ skillTopic, lessonContext, lessonId, userId, locale = "en" }: VoiceMentorFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center group"
            aria-label="Ask Pebble"
          >
            <Mic className="w-6 h-6" />
            {/* Pulsing glow */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Desktop label */}
            <span className="hidden md:block absolute right-full mr-3 whitespace-nowrap bg-card text-foreground text-sm font-medium px-3 py-1.5 rounded-lg shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Ask Pebble
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <VoiceMentorPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        skillTopic={skillTopic}
        lessonContext={lessonContext}
        lessonId={lessonId}
        userId={userId}
        locale={locale}
      />
    </>
  );
};

export default VoiceMentorFAB;
