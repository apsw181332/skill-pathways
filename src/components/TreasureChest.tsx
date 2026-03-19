import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Diamond } from "lucide-react";
import { Button } from "@/components/ui/button";
import Confetti from "@/components/Confetti";

type ChestTier = "rare" | "epic" | "legendary";

const CHEST_CONFIG: Record<ChestTier, { label: string; color: string; gems: [number, number]; glow: string }> = {
  rare: { label: "Rare Chest", color: "from-blue-400 to-blue-600", gems: [5, 15], glow: "shadow-[0_0_30px_hsl(var(--primary)/0.4)]" },
  epic: { label: "Epic Chest", color: "from-purple-400 to-purple-600", gems: [20, 40], glow: "shadow-[0_0_40px_hsl(270_60%_50%/0.5)]" },
  legendary: { label: "Legendary Chest", color: "from-amber-400 to-amber-600", gems: [50, 100], glow: "shadow-[0_0_50px_hsl(var(--accent)/0.6)]" },
};

interface TreasureChestProps {
  onComplete: (gems: number) => void;
  onClose: () => void;
}

const TreasureChest = ({ onComplete, onClose }: TreasureChestProps) => {
  const [tier, setTier] = useState<ChestTier>("rare");
  const [clickCount, setClickCount] = useState(0);
  const [opened, setOpened] = useState(false);
  const [gemsWon, setGemsWon] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [upgradeAnim, setUpgradeAnim] = useState(false);
  

  const config = CHEST_CONFIG[tier];

  const getRandomGems = (t: ChestTier) => {
    const [min, max] = CHEST_CONFIG[t].gems;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  const chestEmoji = tier === "rare" ? "📦" : tier === "epic" ? "🎁" : "👑";

  const handleChestClick = () => {
    if (opened) return;
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 3) {
      const gems = getRandomGems(tier);
      setGemsWon(gems);
      setOpened(true);
      setShowConfetti(true);
      return;
    }

    if (Math.random() < 0.2) {
      if (tier === "rare") { setTier("epic"); setUpgradeAnim(true); setTimeout(() => setUpgradeAnim(false), 600); }
      else if (tier === "epic") { setTier("legendary"); setUpgradeAnim(true); setTimeout(() => setUpgradeAnim(false), 600); }
    }
  };

  const handleCollect = () => {
    // Navigate immediately — no "collecting" state needed
    onComplete(gemsWon);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center px-6"
    >
      <Confetti active={showConfetti} />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-sm w-full text-center"
      >
        {!opened ? (
          <>
            <motion.div
              animate={upgradeAnim ? { scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] } : {}}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.08 }}
                onClick={handleChestClick}
                className={`text-[120px] leading-none cursor-pointer mx-auto block drop-shadow-2xl select-none ${upgradeAnim ? "animate-pulse" : ""} ${config.glow} rounded-3xl p-4`}
                aria-label="Tap the chest"
              >
                {chestEmoji}
              </motion.button>

              <motion.div key={tier} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4">
                <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold text-white bg-gradient-to-r ${config.color}`}>
                  {config.label}
                </span>
              </motion.div>
            </motion.div>

            <p className="text-white/80 text-sm mb-2">
              Tap the chest {3 - clickCount} more time{3 - clickCount !== 1 ? "s" : ""} to open!
            </p>
            <p className="text-white/50 text-xs mb-6">20% chance to upgrade each tap ✨</p>

            <div className="flex justify-center gap-3 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < clickCount ? "bg-primary scale-110" : "bg-white/20"}`} />
              ))}
            </div>

            <button onClick={onClose} className="mt-2 text-white/40 text-sm hover:text-white/60 transition-colors">Skip</button>
          </>
        ) : (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
            <div className="text-7xl mb-4">{chestEmoji}</div>
            <div className="text-6xl mb-2">✨</div>
            <h2 className="text-2xl font-bold text-white mb-2">{config.label} Opened!</h2>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
              className="flex items-center justify-center gap-2 mb-6"
            >
              <Diamond className="w-8 h-8 text-cyan-400" />
              <span className="text-4xl font-bold text-cyan-400">+{gemsWon}</span>
            </motion.div>
            <p className="text-white/60 text-sm mb-6">Gems added to your balance!</p>
            <Button onClick={handleCollect} size="lg" className="w-full">
              Collect Gems 💎
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TreasureChest;
