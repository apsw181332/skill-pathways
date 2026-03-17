/**
 * Learning Code System
 * 9-digit numeric code encoding a user's learning profile.
 * Each digit is 0–2 representing low/moderate/high.
 *
 * Position | Criteria              | 0         | 1          | 2
 * ---------|----------------------|-----------|------------|------------
 * 1        | Learning Speed       | Thorough  | Moderate   | Fast
 * 2        | Visual Preference    | Low       | Moderate   | High
 * 3        | Auditory Preference  | Low       | Moderate   | High
 * 4        | Kinesthetic Pref.    | Low       | Moderate   | High
 * 5        | Reading/Writing Pref | Low       | Moderate   | High
 * 6        | Attention Span       | Short     | Moderate   | Long
 * 7        | Social Learning      | Solo      | Balanced   | Collaborative
 * 8        | Content Complexity   | Simple    | Moderate   | Complex
 * 9        | Accessibility Needs  | None      | Some       | Significant
 */

export const LEARNING_CODE_CRITERIA = [
  { position: 1, name: "Learning Speed", levels: ["Thorough/Slow", "Moderate", "Fast"] },
  { position: 2, name: "Visual Preference", levels: ["Low", "Moderate", "High"] },
  { position: 3, name: "Auditory Preference", levels: ["Low", "Moderate", "High"] },
  { position: 4, name: "Kinesthetic Preference", levels: ["Low", "Moderate", "High"] },
  { position: 5, name: "Reading/Writing Preference", levels: ["Low", "Moderate", "High"] },
  { position: 6, name: "Attention Span", levels: ["Short", "Moderate", "Long"] },
  { position: 7, name: "Social Learning", levels: ["Solo", "Balanced", "Collaborative"] },
  { position: 8, name: "Content Complexity", levels: ["Simple", "Moderate", "Complex"] },
  { position: 9, name: "Accessibility Needs", levels: ["None", "Some", "Significant"] },
];

export function generateLearningCode(
  learningStyle: string,
  interests: string[],
  accessibilityModes: string[]
): string {
  // Position 1: Learning Speed — default moderate
  const speed = 1;

  // Positions 2-4: VARK preferences from selected learning style
  const visual = learningStyle === "visual" ? 2 : 1;
  const auditory = learningStyle === "auditory" ? 2 : 1;
  const kinesthetic = learningStyle === "kinesthetic" ? 2 : 1;

  // Position 5: Reading/Writing — inferred (visual learners tend to be readers too)
  const readWrite = learningStyle === "visual" ? 2 : 1;

  // Position 6: Attention span — ADHD mode = short, otherwise moderate
  const attention = accessibilityModes.includes("adhd") ? 0 : 1;

  // Position 7: Social learning — social interest = collaborative
  const social = interests.includes("social") ? 2 : 1;

  // Position 8: Content complexity — more interests = higher complexity tolerance
  const complexity = interests.length >= 4 ? 2 : interests.length >= 2 ? 1 : 0;

  // Position 9: Accessibility needs
  const accessNeeds = accessibilityModes.length >= 3 ? 2 : accessibilityModes.length >= 1 ? 1 : 0;

  return `${speed}${visual}${auditory}${kinesthetic}${readWrite}${attention}${social}${complexity}${accessNeeds}`;
}

export function decodeLearningCode(code: string): { name: string; value: number; label: string }[] {
  if (!code || code.length !== 9) return [];
  return LEARNING_CODE_CRITERIA.map((criterion, i) => {
    const value = parseInt(code[i], 10);
    return {
      name: criterion.name,
      value: isNaN(value) ? 1 : value,
      label: criterion.levels[isNaN(value) ? 1 : value] || "Unknown",
    };
  });
}

/**
 * Lesson performance metrics collected during a lesson session.
 */
export interface LessonMetrics {
  /** Average seconds spent on "info" steps */
  avgReadingTimeSec: number;
  /** Total quiz accuracy 0-1 */
  accuracy: number;
  /** Number of quiz questions answered */
  totalQuizzes: number;
  /** Number of info steps viewed */
  infoStepsCount: number;
  /** Average content length (chars) of info steps */
  avgContentLength: number;
}

/**
 * Nudge the learning code toward observed behavior.
 * Each call makes small adjustments (±1) to avoid wild swings.
 * Only positions 1, 5, 6, 8 are adapted from lesson behavior.
 */
export function adaptLearningCode(currentCode: string, metrics: LessonMetrics): string {
  if (!currentCode || currentCode.length !== 9) return currentCode;

  const digits = currentCode.split("").map(d => {
    const n = parseInt(d, 10);
    return isNaN(n) ? 1 : n;
  });

  const clamp = (v: number) => Math.max(0, Math.min(2, v));

  // Expected reading time: ~15 sec per 200 chars at moderate pace
  const expectedReadSec = Math.max(5, (metrics.avgContentLength / 200) * 15);
  const readRatio = metrics.avgReadingTimeSec / expectedReadSec;

  // Position 1: Learning Speed — fast reader + high accuracy = fast learner
  if (readRatio < 0.5 && metrics.accuracy >= 0.8) {
    digits[0] = clamp(digits[0] + 1); // trending fast
  } else if (readRatio > 1.5 && metrics.accuracy >= 0.7) {
    digits[0] = clamp(digits[0] - 1); // trending thorough
  }

  // Position 5: Reading/Writing Preference — long reading time = high preference
  if (metrics.avgReadingTimeSec > expectedReadSec * 1.3) {
    digits[4] = clamp(digits[4] + 1);
  } else if (metrics.avgReadingTimeSec < expectedReadSec * 0.5) {
    digits[4] = clamp(digits[4] - 1);
  }

  // Position 6: Attention Span — fast reads + low accuracy = short attention
  if (readRatio < 0.6 && metrics.accuracy < 0.5) {
    digits[5] = clamp(digits[5] - 1); // short attention
  } else if (readRatio >= 1.0 && metrics.accuracy >= 0.8) {
    digits[5] = clamp(digits[5] + 1); // long attention
  }

  // Position 8: Content Complexity — high accuracy = can handle more complex content
  if (metrics.accuracy >= 0.9 && metrics.totalQuizzes >= 3) {
    digits[7] = clamp(digits[7] + 1);
  } else if (metrics.accuracy < 0.4 && metrics.totalQuizzes >= 3) {
    digits[7] = clamp(digits[7] - 1);
  }

  return digits.join("");
}

/**
 * Determine if Pebble should intervene about reading pace.
 * Returns a message or null.
 */
export function getReadingPaceIntervention(
  readingTimeSec: number,
  contentLength: number,
  recentAccuracy: number
): string | null {
  const expectedSec = Math.max(5, (contentLength / 200) * 12);

  // Fast reading + low accuracy → needs to slow down
  if (readingTimeSec < expectedSec * 0.4 && recentAccuracy < 0.6) {
    return "Whoa, slow down a little! 🐧 Take your time reading — you'll remember more and get better scores!";
  }

  if (readingTimeSec < expectedSec * 0.3) {
    return "Hey! Try reading more carefully — the details matter for the quiz coming up! 📖";
  }

  return null;
}
