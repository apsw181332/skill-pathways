import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Palette, Volume2, VolumeX, Globe, Eye, Languages, User, Lock, Check, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import { type UserSettings, THEME_COLORS, applyThemeColor } from "@/hooks/useSettings";
import { useTranslation, type Locale } from "@/lib/i18n";
import { ACCESSIBILITY_MODES, applyAccessibilityModes } from "@/lib/accessibility";
import { useTranslatedContent } from "@/hooks/useTranslation";

import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export { applyAccessibilityModes };

export const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { code: "zh-TW", label: "繁體中文", flag: "🇹🇼" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ko", label: "한국어", flag: "🇰🇷" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
];

interface SettingsProps {
  settings: UserSettings;
  onUpdate: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  onBack: () => void;
  locale?: Locale;
  userId?: string;
}

const Settings = ({ settings, onUpdate, onBack, locale = "en", userId }: SettingsProps) => {
  const { t } = useTranslation(locale);
  const { toast } = useToast();

  // Translate accessibility mode labels and descriptions
  const accessibilityTexts = useMemo(() =>
    ACCESSIBILITY_MODES.flatMap(m => [m.label, m.description]),
  []);
  const { translated: tAccessibility } = useTranslatedContent(accessibilityTexts, locale, "accessibility settings labels");
  const getAccessLabel = (i: number) => tAccessibility[i * 2] ?? ACCESSIBILITY_MODES[i].label;
  const getAccessDesc = (i: number) => tAccessibility[i * 2 + 1] ?? ACCESSIBILITY_MODES[i].description;

  // Display name state
  const [displayName, setDisplayName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameLoaded, setNameLoaded] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // Load display name on first render
  if (!nameLoaded && userId) {
    setNameLoaded(true);
    supabase.from("profiles").select("display_name").eq("user_id", userId).single().then(({ data }) => {
      if (data?.display_name) setDisplayName(data.display_name);
    });
  }

  const handleNameSave = async () => {
    const trimmed = displayName.trim();
    if (!trimmed || !userId) return;
    setNameLoading(true);
    const { error } = await supabase.from("profiles").update({ display_name: trimmed }).eq("user_id", userId);
    setNameLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Display name updated!" });
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast({ title: "Password too short", description: "Must be at least 8 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleColorChange = (color: string) => {
    applyThemeColor(color);
    onUpdate("theme_color", color);
  };

  const handleLanguageChange = (lang: string) => {
    onUpdate("language" as keyof UserSettings, lang as any);
  };

  const toggleAccessibilityMode = (modeId: string) => {
    const current = (settings as any).accessibility_modes || [];
    const next = current.includes(modeId)
      ? current.filter((m: string) => m !== modeId)
      : [...current, modeId];
    applyAccessibilityModes(next);
    onUpdate("accessibility_modes" as keyof UserSettings, next as any);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{t("settings.title")}</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        <Mascot message={t("settings.title") !== "Settings" ? t("settings.title") + " ⚙️" : "Make Pathways feel like yours! Customize everything. ⚙️"} size="sm" animation="idle" />

        {/* Account — Display Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("settings.display_name")}</h2>
          </div>
          <div className="flex gap-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              maxLength={50}
              className="flex-1"
            />
            <Button onClick={handleNameSave} disabled={nameLoading || !displayName.trim()} size="sm">
              {nameLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>

        {/* Account — Change Password */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }} className="lesson-card">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("settings.change_password")}</h2>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              minLength={8}
            />
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
            <Button onClick={handlePasswordChange} disabled={pwLoading || !newPassword || !confirmPassword} className="w-full">
              {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {t("settings.update_password")}
            </Button>
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="lesson-card">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("settings.language")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("settings.language_desc")}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  (settings as any).language === lang.code
                    ? "bg-primary/10 text-primary ring-2 ring-primary font-semibold"
                    : "bg-secondary text-foreground hover:bg-secondary/80"
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Accessibility — 18 modes */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="lesson-card">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("settings.accessibility")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("settings.accessibility_desc")}</p>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {ACCESSIBILITY_MODES.map((mode, idx) => {
              const isActive = ((settings as any).accessibility_modes || []).includes(mode.id);
              return (
                <button
                  key={mode.id}
                  onClick={() => toggleAccessibilityMode(mode.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isActive ? "bg-primary/10 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <span className="text-xl shrink-0">{mode.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground text-sm">{getAccessLabel(idx)}</span>
                    <p className="text-xs text-muted-foreground">{getAccessDesc(idx)}</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={() => toggleAccessibilityMode(mode.id)} />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Theme Color */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="lesson-card">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("settings.theme")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("settings.theme_desc")}</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {Object.entries(THEME_COLORS).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleColorChange(key)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  settings.theme_color === key ? "bg-secondary ring-2 ring-primary" : "hover:bg-secondary/50"
                }`}
              >
                <div className="w-8 h-8 rounded-full border-2 border-border shadow-sm" style={{ backgroundColor: `hsl(${theme.primary})` }} />
                <span className="text-xs text-muted-foreground">{theme.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sound Effects */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lesson-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.sound_enabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
              <div>
                <h2 className="font-semibold text-foreground">{t("settings.sound")}</h2>
                <p className="text-sm text-muted-foreground">{t("settings.sound_desc")}</p>
              </div>
            </div>
            <Switch checked={settings.sound_enabled} onCheckedChange={(v) => onUpdate("sound_enabled", v)} />
          </div>
        </motion.div>

        {/* TTS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="lesson-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-primary" />
              <div>
                <h2 className="font-semibold text-foreground">{t("settings.tts")}</h2>
                <p className="text-sm text-muted-foreground">{t("settings.tts_desc")}</p>
              </div>
            </div>
            <Switch checked={settings.tts_enabled} onCheckedChange={(v) => onUpdate("tts_enabled", v)} />
          </div>
        </motion.div>

        {/* Delete Account */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="lesson-card border-destructive/30">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-5 h-5 text-destructive" />
            <h2 className="font-semibold text-foreground">{t("settings.delete_account") || "Delete Account"}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            This will permanently delete your account, all progress, badges, and data. This action cannot be undone.
          </p>
          <DeleteAccountButton userId={userId} />
        </motion.div>
      </main>
    </div>
  );
};

function DeleteAccountButton({ userId }: { userId?: string }) {
  const [step, setStep] = useState<"idle" | "confirm" | "deleting">("idle");
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== "DELETE" || !userId) return;
    setStep("deleting");
    try {
      const { error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      toast({ title: "Account deleted", description: "Your account has been permanently deleted." });
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete account.", variant: "destructive" });
      setStep("confirm");
    }
  };

  if (step === "idle") {
    return (
      <Button variant="destructive" onClick={() => setStep("confirm")} className="w-full gap-2">
        <Trash2 className="w-4 h-4" /> Delete my account
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30">
        <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
        <p className="text-sm text-destructive font-medium">Type DELETE to confirm</p>
      </div>
      <Input
        value={confirmText}
        onChange={e => setConfirmText(e.target.value)}
        placeholder="Type DELETE"
        className="font-mono"
      />
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => { setStep("idle"); setConfirmText(""); }} className="flex-1">
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={confirmText !== "DELETE" || step === "deleting"}
          className="flex-1 gap-2"
        >
          {step === "deleting" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          {step === "deleting" ? "Deleting..." : "Confirm Delete"}
        </Button>
      </div>
    </div>
  );
}

export default Settings;
