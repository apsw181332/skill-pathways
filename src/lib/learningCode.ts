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
