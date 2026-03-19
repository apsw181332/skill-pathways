/**
 * The Nine Paths — themed progression paths that add story elements
 * Each path has visual effects for correct answers and lesson completion
 */

export interface PathDef {
  id: string;
  name: string;
  emoji: string;
  description: string;
  correctEffect: string; // CSS class or description for correct answer flash
  correctEmoji: string;  // Emoji that flashes on correct answer
  endLessonDescription: string;
  color: string; // Tailwind color name for theming
  relatedInterests: string[]; // Which onboarding interests align with this path
}

export const NINE_PATHS: PathDef[] = [
  {
    id: "syntax",
    name: "Path of Syntax",
    emoji: "💻",
    description: "Master the language of logic and technology",
    correctEffect: "syntax-correct",
    correctEmoji: "⚡",
    endLessonDescription: "A hologram wall of code assembles and flashes brightly",
    color: "emerald",
    relatedInterests: ["tech"],
  },
  {
    id: "eloquence",
    name: "Path of Eloquence",
    emoji: "📜",
    description: "Harness the power of words and communication",
    correctEffect: "eloquence-correct",
    correctEmoji: "✨",
    endLessonDescription: "Floating multilingual text forms a shining arc",
    color: "violet",
    relatedInterests: ["social", "legal"],
  },
  {
    id: "treasury",
    name: "Path of Treasury",
    emoji: "🪙",
    description: "Unlock the secrets of wealth and resources",
    correctEffect: "treasury-correct",
    correctEmoji: "🪙",
    endLessonDescription: "A treasure chest opens, releasing golden sparkles",
    color: "amber",
    relatedInterests: ["financial"],
  },
  {
    id: "vitality",
    name: "Path of Vitality",
    emoji: "🌿",
    description: "Grow your health, energy, and inner strength",
    correctEffect: "vitality-correct",
    correctEmoji: "🍃",
    endLessonDescription: "A blooming flower grows into a glowing vine",
    color: "green",
    relatedInterests: ["health", "cooking"],
  },
  {
    id: "chronos",
    name: "Path of Chronos",
    emoji: "⏳",
    description: "Master time, planning, and organization",
    correctEffect: "chronos-correct",
    correctEmoji: "⏱️",
    endLessonDescription: "A spinning clock stops and time particles explode",
    color: "sky",
    relatedInterests: ["career"],
  },
  {
    id: "fortitude",
    name: "Path of Fortitude",
    emoji: "🛡️",
    description: "Build resilience, safety, and protection",
    correctEffect: "fortitude-correct",
    correctEmoji: "🛡️",
    endLessonDescription: "A massive radiant shield forms and shines",
    color: "slate",
    relatedInterests: ["legal", "tech"],
  },
  {
    id: "surge",
    name: "Path of Surge",
    emoji: "⚡",
    description: "Channel raw energy and rapid growth",
    correctEffect: "surge-correct",
    correctEmoji: "⚡",
    endLessonDescription: "A thunderbolt strikes with a bright electric burst",
    color: "yellow",
    relatedInterests: ["career", "financial"],
  },
  {
    id: "unity",
    name: "Path of Unity",
    emoji: "🤝",
    description: "Forge bonds, empathy, and community",
    correctEffect: "unity-correct",
    correctEmoji: "💗",
    endLessonDescription: "Connecting lights form a glowing network of bonds",
    color: "pink",
    relatedInterests: ["social", "home"],
  },
  {
    id: "cosmos",
    name: "Path of Cosmos",
    emoji: "🌌",
    description: "Explore the vast unknown and expand your mind",
    correctEffect: "cosmos-correct",
    correctEmoji: "⭐",
    endLessonDescription: "A miniature supernova bursts into stardust and light",
    color: "indigo",
    relatedInterests: ["health", "cooking", "home"],
  },
];

/**
 * Given user interests, return the 3 most relevant paths
 */
export function getRecommendedPaths(interests: string[]): PathDef[] {
  if (!interests.length) return NINE_PATHS.slice(0, 3);

  const scored = NINE_PATHS.map(p => ({
    path: p,
    score: p.relatedInterests.filter(ri => interests.includes(ri)).length,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map(s => s.path);
}
