import { motion } from "framer-motion";
import { ArrowLeft, Palette, Volume2, VolumeX, Globe, Eye, Languages } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Mascot from "@/components/Mascot";
import { type UserSettings, THEME_COLORS, applyThemeColor } from "@/hooks/useSettings";
import { useTranslation, type Locale } from "@/lib/i18n";

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

export const ACCESSIBILITY_MODES = [
  { id: "dyslexic", label: "Dyslexia-Friendly", description: "Uses OpenDyslexic font with wider spacing for easier reading", icon: "📖", cssClass: "dyslexic-mode" },
  { id: "colorblind", label: "Colorblind-Friendly", description: "Adds patterns and text styles to differentiate elements without relying on color", icon: "🎨", cssClass: "colorblind-mode" },
  { id: "adhd", label: "ADHD-Friendly", description: "Reduces animations, increases tap targets, and simplifies layout", icon: "🧠", cssClass: "adhd-mode" },
  { id: "high-contrast", label: "High Contrast", description: "Maximum contrast between text and background for low vision", icon: "👁️", cssClass: "high-contrast-mode" },
];

interface SettingsProps {
  settings: UserSettings;
  onUpdate: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  onBack: () => void;
  locale?: Locale;
}

export function applyAccessibilityModes(modes: string[]) {
  const root = document.documentElement;
  ACCESSIBILITY_MODES.forEach(mode => {
    root.classList.toggle(mode.cssClass, modes.includes(mode.id));
  });
}

const Settings = ({ settings, onUpdate, onBack, locale = "en" }: SettingsProps) => {
  const { t } = useTranslation(locale);
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
        <Mascot message="Make Pathways feel like yours! Customize everything. ⚙️" size="sm" animation="idle" />

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card">
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

        {/* Accessibility */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="lesson-card">
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t("settings.accessibility")}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t("settings.accessibility_desc")}</p>
          <div className="space-y-3">
            {ACCESSIBILITY_MODES.map(mode => {
              const isActive = ((settings as any).accessibility_modes || []).includes(mode.id);
              return (
                <button
                  key={mode.id}
                  onClick={() => toggleAccessibilityMode(mode.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    isActive ? "bg-primary/10 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  <span className="text-2xl">{mode.icon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-foreground text-sm">{mode.label}</span>
                    <p className="text-xs text-muted-foreground">{mode.description}</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={() => toggleAccessibilityMode(mode.id)} />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Theme Color */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lesson-card">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="lesson-card">
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
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="lesson-card">
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
      </main>
    </div>
  );
};

export default Settings;
