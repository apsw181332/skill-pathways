import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Diamond } from "lucide-react";
import Mascot from "@/components/Mascot";
import { useTranslatedContent } from "@/hooks/useTranslation";
import type { Locale } from "@/lib/i18n";

interface Mission {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement: (stats: MissionStats) => boolean;
  reward: number;
}

export interface MissionStats {
  lessonsCompleted: number;
  totalXp: number;
  streak: number;
  quizzesCorrect: number;
  coursesEnrolled: number;
  friendsCount: number;
}

export const MISSIONS: Mission[] = [
  { id: "m1", title: "First Steps", description: "Complete your first lesson", emoji: "🐣", requirement: (s) => s.lessonsCompleted >= 1, reward: 10 },
  { id: "m2", title: "Getting Started", description: "Earn 50 XP", emoji: "⭐", requirement: (s) => s.totalXp >= 50, reward: 15 },
  { id: "m3", title: "Curious Mind", description: "Enroll in 2 courses", emoji: "📚", requirement: (s) => s.coursesEnrolled >= 2, reward: 20 },
  { id: "m4", title: "Streak Starter", description: "Get a 2-day streak", emoji: "🔥", requirement: (s) => s.streak >= 2, reward: 20 },
  { id: "m5", title: "Quick Learner", description: "Complete 3 lessons", emoji: "🚀", requirement: (s) => s.lessonsCompleted >= 3, reward: 25 },
  { id: "m6", title: "XP Hunter", description: "Earn 200 XP total", emoji: "💫", requirement: (s) => s.totalXp >= 200, reward: 30 },
  { id: "m7", title: "Dedicated Student", description: "Complete 5 lessons", emoji: "📖", requirement: (s) => s.lessonsCompleted >= 5, reward: 35 },
  { id: "m8", title: "Streak Master", description: "Get a 5-day streak", emoji: "⚡", requirement: (s) => s.streak >= 5, reward: 40 },
  { id: "m9", title: "Social Learner", description: "Add your first friend", emoji: "🤝", requirement: (s) => s.friendsCount >= 1, reward: 25 },
  { id: "m10", title: "Knowledge Seeker", description: "Complete 10 lessons", emoji: "🏅", requirement: (s) => s.lessonsCompleted >= 10, reward: 50 },
  { id: "m11", title: "XP Champion", description: "Earn 500 XP total", emoji: "🏆", requirement: (s) => s.totalXp >= 500, reward: 60 },
  { id: "m12", title: "Full Commitment", description: "Enroll in 3 courses", emoji: "🎯", requirement: (s) => s.coursesEnrolled >= 3, reward: 40 },
  { id: "m13", title: "Streak Legend", description: "Get a 7-day streak", emoji: "🔥", requirement: (s) => s.streak >= 7, reward: 75 },
  { id: "m14", title: "Master Learner", description: "Complete 20 lessons", emoji: "🎓", requirement: (s) => s.lessonsCompleted >= 20, reward: 100 },
  { id: "m15", title: "XP Legend", description: "Earn 1000 XP total", emoji: "👑", requirement: (s) => s.totalXp >= 1000, reward: 150 },
];

// Title definitions - earned via missions, not purchased
export const TITLE_REWARDS: Record<string, { title: string; missionId: string }> = {
  "m5": { title: "Scholar", missionId: "m5" },
  "m10": { title: "Champion", missionId: "m10" },
  "m14": { title: "Legend", missionId: "m14" },
  "m15": { title: "Grand Master", missionId: "m15" },
};

interface MissionsProps {
  stats: MissionStats;
  claimedMissions: string[];
  onClaim: (missionId: string, reward: number) => void;
  locale?: Locale;
}

const Missions = ({ stats, claimedMissions, onClaim, locale = "en" }: MissionsProps) => {
  // Collect all translatable texts: mascot msg + titles + descriptions
  const textsToTranslate = useMemo(() => {
    const texts = [
      "Claim every reward you have earned — missions stack independently now! 💎",
      "Missions",
      ...MISSIONS.flatMap(m => [m.title, m.description]),
    ];
    // Also title reward labels
    Object.values(TITLE_REWARDS).forEach(tr => {
      texts.push(`Unlocks "${tr.title}" title`);
    });
    texts.push("Done ✓", "Claim!");
    return texts;
  }, []);

  const { translated: tTexts } = useTranslatedContent(textsToTranslate, locale, "missions page UI");

  // Helper to get translated text by index
  const tMascot = tTexts[0];
  const tMissionsHeader = tTexts[1];
  // Missions start at index 2, each mission has 2 entries (title, description)
  const getMissionTitle = (i: number) => tTexts[2 + i * 2] ?? MISSIONS[i].title;
  const getMissionDesc = (i: number) => tTexts[2 + i * 2 + 1] ?? MISSIONS[i].description;
  // Title rewards start after missions (2 + 15*2 = 32)
  const titleRewardKeys = Object.keys(TITLE_REWARDS);
  const getTitleRewardLabel = (missionId: string) => {
    const idx = titleRewardKeys.indexOf(missionId);
    if (idx === -1) return null;
    return tTexts[32 + idx] ?? `Unlocks "${TITLE_REWARDS[missionId].title}" title`;
  };
  const tDone = tTexts[32 + titleRewardKeys.length] ?? "Done ✓";
  const tClaim = tTexts[32 + titleRewardKeys.length + 1] ?? "Claim!";

  // Sort: claimable first, then unclaimed incomplete, then claimed
  const sortedMissions = [...MISSIONS].sort((a, b) => {
    const aIdx = MISSIONS.indexOf(a);
    const bIdx = MISSIONS.indexOf(b);
    const aClaimed = claimedMissions.includes(a.id);
    const bClaimed = claimedMissions.includes(b.id);
    const aCanClaim = !aClaimed && a.requirement(stats);
    const bCanClaim = !bClaimed && b.requirement(stats);

    if (aCanClaim && !bCanClaim) return -1;
    if (!aCanClaim && bCanClaim) return 1;
    if (aClaimed && !bClaimed) return 1;
    if (!aClaimed && bClaimed) return -1;
    return 0;
  });

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Mascot message={tMascot} size="sm" animation="bounce" />
      </motion.div>

      <h2 className="text-xl font-semibold text-foreground mb-4">{tMissionsHeader}</h2>

      <div className="space-y-3">
        {sortedMissions.map((mission, i) => {
          const origIdx = MISSIONS.indexOf(mission);
          const claimed = claimedMissions.includes(mission.id);
          const canClaim = !claimed && mission.requirement(stats);
          const titleReward = TITLE_REWARDS[mission.id];

          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`lesson-card flex items-center gap-4 py-4 ${
                claimed ? "border-primary/20 bg-primary/5 opacity-70" :
                canClaim ? "border-primary" :
                "opacity-70"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-2xl shrink-0">
                {mission.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{getMissionTitle(origIdx)}</span>
                  {claimed && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground">{getMissionDesc(origIdx)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-primary font-medium">
                    <Diamond className="w-3 h-3" /> +{mission.reward} gems
                  </div>
                  {titleReward && (
                    <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                      🏅 {getTitleRewardLabel(mission.id)}
                    </span>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {claimed ? (
                  <span className="text-xs text-primary font-medium">{tDone}</span>
                ) : canClaim ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onClaim(mission.id, mission.reward)}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                  >
                    {tClaim}
                  </motion.button>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
};

export default Missions;
