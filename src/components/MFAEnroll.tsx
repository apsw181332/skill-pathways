import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MFAEnrollProps {
  onEnrolled: () => void;
  onSkip: () => void;
}

const MFAEnroll = ({ onEnrolled, onSkip }: MFAEnrollProps) => {
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [factorId, setFactorId] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Pathways Authenticator",
      });
      if (error) {
        toast({ title: "Error setting up 2FA", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setLoading(false);
    })();
  }, []);

  const handleVerify = async () => {
    if (verifyCode.length < 6) return;
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

      toast({ title: "2FA enabled!", description: "Your account is now more secure." });
      onEnrolled();
    } catch (err: any) {
      toast({ title: "Verification failed", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
        className="w-full max-w-sm"
      >
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Enable 2FA</h1>
        </div>
        <p className="text-muted-foreground text-center mb-6 text-sm">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>

        {qrCode && (
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-white rounded-xl shadow-md">
              <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2 text-center">Can't scan? Enter this code manually:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all text-foreground">
              {secret}
            </code>
            <Button variant="ghost" size="sm" onClick={copySecret} className="shrink-0">
              {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Enter the 6-digit code from your app
            </label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em] font-mono"
            />
          </div>

          <Button
            onClick={handleVerify}
            disabled={verifyCode.length < 6 || verifying}
            className="w-full gap-2"
            size="lg"
          >
            {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {verifying ? "Verifying..." : "Enable 2FA"}
          </Button>

          <Button variant="ghost" onClick={onSkip} className="w-full text-muted-foreground">
            Skip for now
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default MFAEnroll;
