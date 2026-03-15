export const LEVELS = [
  { level: 1, name: "Beginner", minXp: 0, emoji: "🌱" },
  { level: 2, name: "Novice", minXp: 100, emoji: "🌿" },
  { level: 3, name: "Learner", minXp: 300, emoji: "🌳" },
  { level: 4, name: "Skilled", minXp: 600, emoji: "⚡" },
  { level: 5, name: "Advanced", minXp: 1000, emoji: "🔥" },
  { level: 6, name: "Expert", minXp: 1500, emoji: "💎" },
  { level: 7, name: "Master", minXp: 2500, emoji: "👑" },
  { level: 8, name: "Legend", minXp: 4000, emoji: "🏆" },
];

export function getLevelForXp(xp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXp) current = lvl;
    else break;
  }
  return current;
}

export function getXpProgress(xp: number) {
  const current = getLevelForXp(xp);
  const nextIdx = LEVELS.findIndex((l) => l.level === current.level) + 1;
  if (nextIdx >= LEVELS.length) return { current, next: null, progress: 100 };
  const next = LEVELS[nextIdx];
  const progress = ((xp - current.minXp) / (next.minXp - current.minXp)) * 100;
  return { current, next, progress: Math.min(progress, 100) };
}
