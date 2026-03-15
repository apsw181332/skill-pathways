import { motion } from "framer-motion";
import { ArrowLeft, Palette, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import Mascot from "@/components/Mascot";
import { type UserSettings, THEME_COLORS, applyThemeColor } from "@/hooks/useSettings";

interface SettingsProps {
  settings: UserSettings;
  onUpdate: <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => Promise<void>;
  onBack: () => void;
}

const Settings = ({ settings, onUpdate, onBack }: SettingsProps) => {
  const handleColorChange = (color: string) => {
    applyThemeColor(color);
    onUpdate("theme_color", color);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="max-w-2xl mx-auto px-6 py-3 flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 pt-6 space-y-6">
        <Mascot message="Make Pathways feel like yours! Customize colors, sounds, and more. ⚙️" size="sm" animation="idle" />

        {/* Theme Color */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lesson-card"
        >
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Theme Color</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Change the accent color of buttons, links, and highlights.</p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
            {Object.entries(THEME_COLORS).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleColorChange(key)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  settings.theme_color === key ? "bg-secondary ring-2 ring-primary" : "hover:bg-secondary/50"
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                  style={{ backgroundColor: `hsl(${theme.primary})` }}
                />
                <span className="text-xs text-muted-foreground">{theme.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Sound Effects */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="lesson-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.sound_enabled ? <Volume2 className="w-5 h-5 text-primary" /> : <VolumeX className="w-5 h-5 text-muted-foreground" />}
              <div>
                <h2 className="font-semibold text-foreground">Sound Effects</h2>
                <p className="text-sm text-muted-foreground">Play sounds for correct/wrong answers and button clicks</p>
              </div>
            </div>
            <Switch
              checked={settings.sound_enabled}
              onCheckedChange={(v) => onUpdate("sound_enabled", v)}
            />
          </div>
        </motion.div>

        {/* Voice Narration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lesson-card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.tts_enabled ? <Mic className="w-5 h-5 text-primary" /> : <MicOff className="w-5 h-5 text-muted-foreground" />}
              <div>
                <h2 className="font-semibold text-foreground">Voice Narration</h2>
                <p className="text-sm text-muted-foreground">Pebble reads lesson text aloud for you</p>
              </div>
            </div>
            <Switch
              checked={settings.tts_enabled}
              onCheckedChange={(v) => onUpdate("tts_enabled", v)}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Settings;
