import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";

interface EmailVerifyProps {
  onVerified: () => void;
  userEmail?: string;
}

const EmailVerify = ({ onVerified, userEmail }: EmailVerifyProps) => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(true);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [countdown, setCountdown] = useState(0);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const sendCode = async () => {
    setSending(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-2fa-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      const result = await resp.json();
      if (result.success) {
        setMaskedEmail(result.email);
        setCountdown(60);
        toast({ title: "Code sent!", description: `Verification code sent to ${result.email}` });
      } else {
        throw new Error(result.error || "Failed to send code");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => { sendCode(); }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [sending]);

  const handleVerify = async () => {
    if (code.length < 6) return;
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-2fa-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ code }),
        }
      );
      const result = await resp.json();
      if (result.verified) {
        toast({ title: "Verified! ✅" });
        onVerified();
      } else {
        toast({ title: "Invalid code", description: "Please check your email and try again.", variant: "destructive" });
        setCode("");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (sending && !maskedEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Sending verification code...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message="One more step! Check your email for a verification code. 🔐" size="md" animation="idle" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">Email Verification</h1>
        </div>
        <div className="flex items-center justify-center gap-2 mb-6">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <p className="text-muted-foreground text-center text-sm">
            Code sent to <span className="font-medium text-foreground">{maskedEmail}</span>
          </p>
        </div>

        <div className="space-y-4">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-[0.5em] font-mono"
            onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
          />

          <Button onClick={handleVerify} disabled={code.length < 6 || loading} className="w-full gap-2" size="lg">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <Button
            variant="ghost"
            onClick={sendCode}
            disabled={countdown > 0 || sending}
            className="w-full gap-2 text-muted-foreground"
          >
            <RefreshCw className="w-4 h-4" />
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default EmailVerify;
