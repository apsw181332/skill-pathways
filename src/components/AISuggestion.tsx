import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import mascotImg from "@/assets/mascot-penguin.png";
import { COURSES } from "@/lib/courseData";

interface AISuggestionProps {
  userId: string;
  enrolledCourses: string[];
  onEnroll: (courseId: string) => Promise<boolean>;
}

const AISuggestion = ({ userId, enrolledCourses, onEnroll }: AISuggestionProps) => {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show suggestion after 60 seconds of activity, once per session
    const sessionKey = `ai_suggestion_shown_${userId}`;
    if (sessionStorage.getItem(sessionKey)) return;

    const timer = setTimeout(async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const accessToken = session?.access_token;
        if (!accessToken) return;

        const { data, error } = await supabase.functions.invoke("recommend-paths", {
          body: { type: "suggestion" },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!error && data?.suggestion) {
          setSuggestion(data.suggestion);
          setVisible(true);
          sessionStorage.setItem(sessionKey, "true");
        }
      } catch {
        // Silently fail - not critical
      }
    }, 60000);

    return () => clearTimeout(timer);
  }, [userId]);

  if (!visible || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-24 left-4 right-4 z-[60] max-w-sm mx-auto"
      >
        <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-xl p-4">
          <div className="flex items-start gap-3">
            <img src={mascotImg} alt="Pebble" className="w-10 h-10 object-contain shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Pebble's Suggestion</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{suggestion}</p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-3 ml-13">
            <Button size="sm" variant="outline" onClick={() => setDismissed(true)} className="text-xs">
              Maybe later
            </Button>
            <Button size="sm" onClick={() => setDismissed(true)} className="text-xs gap-1">
              <Sparkles className="w-3 h-3" /> Thanks!
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AISuggestion;
