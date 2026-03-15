import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast({ title: "Password updated!", description: "You can now sign in with your new password." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <Mascot
        message={done ? "All set! Your password has been updated. 🎉" : "Let's set a new password for you! 🔐"}
        size="md"
        animation={done ? "celebrate" : "idle"}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm mt-8"
      >
        {done ? (
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-foreground mb-4">Password updated!</h1>
            <Button onClick={() => window.location.href = "/"} className="gap-2">
              Go to app <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground text-center mb-2">Set new password</h1>
            <p className="text-muted-foreground text-center mb-8 text-sm">Enter your new password below.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? "Updating..." : "Update password"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
