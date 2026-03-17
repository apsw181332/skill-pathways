import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, Lock, UserPlus, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import Mascot from "@/components/Mascot";

function getPasswordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 2) return { score, label: "Fair", color: "bg-accent" };
  if (score <= 3) return { score, label: "Good", color: "bg-primary/70" };
  return { score, label: "Strong", color: "bg-primary" };
}

interface AuthPageProps {
  onAuth: () => void;
  signUp: (email: string, password: string, displayName?: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthPage = ({ onAuth, signUp, signIn, resetPassword }: AuthPageProps) => {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const mascotMessages = {
    login: "Welcome back! Let's continue your journey! 🎯",
    signup: "Awesome! Let's create your account and start learning! 🚀",
    forgot: "No worries! I'll help you reset your password. 📧",
  };

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && strength.score < 2) {
      toast({ title: "Password too weak", description: "Use at least 8 characters with uppercase, numbers, or symbols.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await signUp(email, password, displayName);
        toast({ title: "Account created!", description: "Check your email to verify your account." });
      } else if (mode === "login") {
        await signIn(email, password);
        onAuth();
      } else {
        await resetPassword(email);
        toast({ title: "Reset email sent!", description: "Check your inbox for the password reset link." });
      }
    } catch (error: any) {
      toast({ title: "Oops!", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Mascot message={mascotMessages[mode]} size="md" animation="wave" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <h1 className="text-2xl font-semibold text-foreground text-center mb-2">
          {mode === "login" ? "Welcome back" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          {mode === "login"
            ? "Sign in to continue your learning journey"
            : mode === "signup"
            ? "Join Pathways and start learning life skills"
            : "Enter your email and we'll send you a reset link"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Display name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="pl-10"
            />
          </div>
          {mode !== "forgot" && (
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="pl-10"
              />
            </div>
          )}
          {mode === "signup" && password.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength.score ? strength.color : "bg-muted"}`} />
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${strength.score >= 3 ? "text-primary" : "text-muted-foreground"}`} />
                <span className={`text-xs font-medium ${strength.score >= 3 ? "text-primary" : "text-muted-foreground"}`}>{strength.label}</span>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full gap-2" size="lg" disabled={loading}>
            {loading ? "Loading..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          {mode === "login" && (
            <>
              <button
                onClick={() => setMode("forgot")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Forgot your password?
              </button>
              <button
                onClick={() => setMode("signup")}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Don't have an account? <span className="text-primary font-medium">Sign up</span>
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              onClick={() => setMode("login")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Already have an account? <span className="text-primary font-medium">Sign in</span>
            </button>
          )}
          {mode === "forgot" && (
            <button
              onClick={() => setMode("login")}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
