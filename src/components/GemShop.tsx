import { useMemo } from "react";
import { motion } from "framer-motion";
import { Diamond, Heart, ShieldCheck, Zap, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { TITLE_REWARDS, MISSIONS } from "@/components/Missions";
import { useTranslatedContent } from "@/hooks/useTranslation";
import type { Locale } from "@/lib/i18n";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  icon: React.ReactNode;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "extra-life", name: "Extra Life", description: "Get +1 life for your next lesson", cost: 30, emoji: "❤️", icon: <Heart className="w-5 h-5 text-destructive" /> },
  { id: "life-pack", name: "Life Pack (3)", description: "Get +3 extra lives to use anytime", cost: 75, emoji: "💖", icon: <Heart className="w-5 h-5 text-pink-500" /> },
  { id: "shield", name: "Answer Shield", description: "Protects from one wrong answer", cost: 50, emoji: "🛡️", icon: <ShieldCheck className="w-5 h-5 text-primary" /> },
  { id: "xp-boost", name: "XP Boost (2x)", description: "Double XP on your next lesson", cost: 60, emoji: "⚡", icon: <Zap className="w-5 h-5 text-accent" /> },
];

const TITLE_DISPLAY = [
  { id: "title-scholar", name: "Scholar", emoji: "📚", missionId: "m5", missionName: "Quick Learner" },
  { id: "title-champion", name: "Champion", emoji: "🏆", missionId: "m10", missionName: "Knowledge Seeker" },
  { id: "title-legend", name: "Legend", emoji: "⭐", missionId: "m14", missionName: "Master Learner" },
  { id: "title-master", name: "Grand Master", emoji: "👑", missionId: "m15", missionName: "XP Legend" },
];

interface GemShopProps {
  gems: number;
  extraLives: number;
  ownedTitles: string[];
  onPurchase: (itemId: string, cost: number) => Promise<boolean>;
  locale?: Locale;
}

const GemShop = ({ gems, extraLives, ownedTitles, onPurchase, locale = "en" }: GemShopProps) => {
  const { toast } = useToast();

  const textsToTranslate = useMemo(() => [
    "Gem Shop",
    "Power-Ups",
    "Your Gems",
    "Buy",
    "Titles (Earned via Missions)",
    "Earned ✓",
    "Locked",
    ...SHOP_ITEMS.flatMap(item => [item.name, item.description]),
    ...TITLE_DISPLAY.flatMap(t => [t.name, `Complete "${t.missionName}" mission`]),
  ], []);

  const { translated: tTexts } = useTranslatedContent(textsToTranslate, locale, "gem shop UI");

  const tHeader = tTexts[0];
  const tPowerUps = tTexts[1];
  const tYourGems = tTexts[2];
  const tBuy = tTexts[3];
  const tTitlesHeader = tTexts[4];
  const tEarned = tTexts[5];
  const tLocked = tTexts[6];
  // Shop items start at index 7, 2 per item
  const getItemName = (i: number) => tTexts[7 + i * 2] ?? SHOP_ITEMS[i].name;
  const getItemDesc = (i: number) => tTexts[7 + i * 2 + 1] ?? SHOP_ITEMS[i].description;
  // Title display starts at 7 + 4*2 = 15, 2 per title
  const getTitleName = (i: number) => tTexts[15 + i * 2] ?? TITLE_DISPLAY[i].name;
  const getTitleMissionDesc = (i: number) => tTexts[15 + i * 2 + 1] ?? `Complete "${TITLE_DISPLAY[i].missionName}" mission`;

  const handleBuy = async (item: ShopItem) => {
    if (gems < item.cost) {
      toast({ title: "Not enough gems!", description: `You need ${item.cost - gems} more gems.`, variant: "destructive" });
      return;
    }
    const success = await onPurchase(item.id, item.cost);
    if (success) {
      toast({ title: `${item.emoji} Purchased!`, description: `You bought ${item.name}!` });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">{tHeader}</h2>
        <div className="flex items-center gap-2 bg-secondary rounded-full px-4 py-1.5">
          <Diamond className="w-4 h-4 text-cyan-500" />
          <span className="font-semibold text-foreground">{gems}</span>
          <span className="text-xs text-muted-foreground">{tYourGems}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3">{tPowerUps}</h3>
      <div className="space-y-3 mb-8">
        {SHOP_ITEMS.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="lesson-card flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-foreground">{getItemName(i)}</span>
              <p className="text-xs text-muted-foreground">{getItemDesc(i)}</p>
              {item.id === "extra-life" && extraLives > 0 && (
                <p className="text-xs text-primary mt-0.5">{extraLives} owned</p>
              )}
            </div>
            <Button size="sm" variant={gems >= item.cost ? "default" : "outline"} onClick={() => handleBuy(item)}
              disabled={gems < item.cost} className="gap-1 shrink-0">
              <Diamond className="w-3 h-3" /> {item.cost} · {tBuy}
            </Button>
          </motion.div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3">{tTitlesHeader}</h3>
      <div className="space-y-3">
        {TITLE_DISPLAY.map((title, i) => {
          const owned = ownedTitles.includes(title.id);
          return (
            <motion.div key={title.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`lesson-card flex items-center gap-4 ${owned ? "border-primary/30 bg-primary/5" : "opacity-60"}`}>
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                {title.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{getTitleName(i)}</span>
                <p className="text-xs text-muted-foreground">{getTitleMissionDesc(i)}</p>
              </div>
              <div className="shrink-0">
                {owned ? (
                  <span className="text-xs text-primary font-medium">{tEarned}</span>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" /> {tLocked}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GemShop;
