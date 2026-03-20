import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";

interface MFAVerifyProps {
  onVerified: () => void;
}

const MFAVerify = ({ onVerified }: MFAVerifyProps) => {
  const [verifyCode, setVerifyCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error || !data) {
        setLoading(false);
        return;
      }
      const totpFactors = data.totp.filter(f => f.status === "verified");
      if (totpFactors.length > 0) {
        setFactorId(totpFactors[0].id);
      }
      setLoading(false);
    })();
  }, []);

  const handleVerify = async () => {
    if (verifyCode.length < 6 || !factorId) return;
    setVerifying(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      onVerified();
    } catch (err: any) {
      toast({ title: "Invalid code", description: "Please check your authenticator app and try again.", variant: "destructive" });
      setVerifyCode("");
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Mascot message="One more step! Enter your 2FA code to continue. 🔐" size="md" animation="idle" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Two-Factor Authentication</h1>
        </div>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Enter the 6-digit code from your authenticator app
        </p>

        <div className="space-y-4">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
          />

          <Button
            onClick={handleVerify}
            disabled={verifyCode.length < 6 || verifying}
            className="w-full gap-2"
            size="lg"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {verifying ? "Verifying..." : "Verify"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default MFAVerify;
