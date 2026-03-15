import { motion } from "framer-motion";
import { Diamond, Heart, Crown, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  type: "consumable" | "title";
  icon: React.ReactNode;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: "extra-life", name: "Extra Life", description: "Get +1 life for your next lesson", cost: 30, emoji: "❤️", type: "consumable", icon: <Heart className="w-5 h-5 text-destructive" /> },
  { id: "life-pack", name: "Life Pack (3)", description: "Get +3 extra lives to use anytime", cost: 75, emoji: "💖", type: "consumable", icon: <Heart className="w-5 h-5 text-pink-500" /> },
  { id: "shield", name: "Answer Shield", description: "Protects from one wrong answer", cost: 50, emoji: "🛡️", type: "consumable", icon: <ShieldCheck className="w-5 h-5 text-primary" /> },
  { id: "xp-boost", name: "XP Boost (2x)", description: "Double XP on your next lesson", cost: 60, emoji: "⚡", type: "consumable", icon: <Zap className="w-5 h-5 text-accent" /> },
  { id: "title-scholar", name: "Title: Scholar", description: "Display 'Scholar' next to your name", cost: 100, emoji: "📚", type: "title", icon: <Crown className="w-5 h-5 text-primary" /> },
  { id: "title-champion", name: "Title: Champion", description: "Display 'Champion' next to your name", cost: 200, emoji: "🏆", type: "title", icon: <Crown className="w-5 h-5 text-accent" /> },
  { id: "title-legend", name: "Title: Legend", description: "Display 'Legend' next to your name", cost: 500, emoji: "⭐", type: "title", icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
  { id: "title-master", name: "Title: Grand Master", description: "The ultimate title of mastery", cost: 1000, emoji: "👑", type: "title", icon: <Crown className="w-5 h-5 text-amber-400" /> },
];

interface GemShopProps {
  gems: number;
  extraLives: number;
  ownedTitles: string[];
  onPurchase: (itemId: string, cost: number) => Promise<boolean>;
}

const GemShop = ({ gems, extraLives, ownedTitles, onPurchase }: GemShopProps) => {
  const { toast } = useToast();

  const handleBuy = async (item: ShopItem) => {
    if (gems < item.cost) {
      toast({ title: "Not enough gems!", description: `You need ${item.cost - gems} more gems.`, variant: "destructive" });
      return;
    }
    if (item.type === "title" && ownedTitles.includes(item.id)) {
      toast({ title: "Already owned!", description: "You already have this title." });
      return;
    }
    const success = await onPurchase(item.id, item.cost);
    if (success) {
      toast({ title: `${item.emoji} Purchased!`, description: `You bought ${item.name}!` });
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="lesson-card text-center mb-6 border-primary/30">
        <Diamond className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
        <div className="text-3xl font-bold text-foreground xp-counter">{gems}</div>
        <div className="text-sm text-muted-foreground">Gems Available</div>
        {extraLives > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">❤️ {extraLives} extra lives in reserve</div>
        )}
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground mb-1">Consumables</h2>
      <p className="text-sm text-muted-foreground mb-4">Use in lessons to gain an edge!</p>
      <div className="space-y-3 mb-6">
        {SHOP_ITEMS.filter(i => i.type === "consumable").map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="lesson-card flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shrink-0">
              {item.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-foreground">{item.name}</div>
              <div className="text-xs text-muted-foreground">{item.description}</div>
            </div>
            <Button size="sm" variant={gems >= item.cost ? "default" : "outline"} onClick={() => handleBuy(item)}
              disabled={gems < item.cost} className="shrink-0 gap-1">
              <Diamond className="w-3 h-3" /> {item.cost}
            </Button>
          </motion.div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-foreground mb-1">Titles</h2>
      <p className="text-sm text-muted-foreground mb-4">Show off your achievements!</p>
      <div className="space-y-3">
        {SHOP_ITEMS.filter(i => i.type === "title").map((item, i) => {
          const owned = ownedTitles.includes(item.id);
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`lesson-card flex items-center gap-4 py-4 ${owned ? "border-primary/30 bg-primary/5" : ""}`}>
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="text-xs text-muted-foreground">{item.description}</div>
              </div>
              {owned ? (
                <span className="text-xs text-primary font-medium px-3 py-1 rounded-full bg-primary/10">Owned ✓</span>
              ) : (
                <Button size="sm" variant={gems >= item.cost ? "default" : "outline"} onClick={() => handleBuy(item)}
                  disabled={gems < item.cost} className="shrink-0 gap-1">
                  <Diamond className="w-3 h-3" /> {item.cost}
                </Button>
              )}
            </motion.div>
          );
        })}
      </div>
    </>
  );
};

export default GemShop;
