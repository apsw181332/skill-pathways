import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";

interface DisplayNamePromptProps {
  userId: string;
  onComplete: () => void;
}

const DisplayNamePrompt = ({ userId, onComplete }: DisplayNamePromptProps) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    try {
      await supabase.from("profiles").update({ display_name: trimmed }).eq("user_id", userId);
      toast({ title: "Welcome, " + trimmed + "! 🎉" });
      onComplete();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message="Hey there! What should I call you? 🐧" size="md" animation="wave" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-foreground text-center mb-2">Choose a Display Name</h1>
        <p className="text-muted-foreground text-center mb-6 text-sm">This is how others will see you on Pathways</p>

        <div className="space-y-4">
          <div className="relative">
            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Your display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="pl-10"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            />
          </div>

          <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default DisplayNamePrompt;
