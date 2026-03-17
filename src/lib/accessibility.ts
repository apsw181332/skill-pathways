/**
 * Comprehensive accessibility modes — 18 disability types with real CSS/UX adaptations.
 * Each mode applies a CSS class to <html> that triggers styles in index.css.
 */
export interface AccessibilityMode {
  id: string;
  label: string;
  description: string;
  icon: string;
  cssClass: string;
}

export const ACCESSIBILITY_MODES: AccessibilityMode[] = [
  // --- Vision ---
  { id: "dyslexia", label: "Dyslexia", icon: "📖", cssClass: "mode-dyslexia",
    description: "OpenDyslexic font, wider letter/word spacing, tinted background for easier reading." },
  { id: "colorblind", label: "Colour Blindness", icon: "🎨", cssClass: "mode-colorblind",
    description: "Uses patterns, underlines, and shapes instead of colour alone to convey meaning." },
  { id: "low-vision", label: "Low Vision", icon: "👁️", cssClass: "mode-low-vision",
    description: "Extra-large text (125%), maximum contrast, bold fonts, thicker borders." },
  { id: "tunnel-vision", label: "Tunnel Vision", icon: "🔭", cssClass: "mode-tunnel-vision",
    description: "Content centred in a narrow column so you never need peripheral scanning." },
  { id: "light-sensitivity", label: "Light Sensitivity / Photophobia", icon: "🌙", cssClass: "mode-light-sensitivity",
    description: "Dark warm-toned background, reduced brightness, no pure white." },

  // --- Cognitive / Neurological ---
  { id: "adhd", label: "ADHD", icon: "🧠", cssClass: "mode-adhd",
    description: "No animations, simplified layout, larger tap targets, focus highlights." },
  { id: "autism", label: "Autism Spectrum", icon: "🧩", cssClass: "mode-autism",
    description: "Calm muted colours, predictable layout, reduced visual noise, no surprises." },
  { id: "epilepsy", label: "Epilepsy / Seizure Sensitivity", icon: "⚡", cssClass: "mode-epilepsy",
    description: "Removes all flashing, pulsing, and rapid transitions." },
  { id: "dyscalculia", label: "Dyscalculia", icon: "🔢", cssClass: "mode-dyscalculia",
    description: "Larger numbers, monospace digits, extra spacing around maths content." },
  { id: "cognitive", label: "Cognitive / Intellectual", icon: "💡", cssClass: "mode-cognitive",
    description: "Simpler layouts, larger text, step-by-step progression, clear headings." },
  { id: "memory", label: "Memory Difficulties", icon: "🧠", cssClass: "mode-memory",
    description: "Persistent breadcrumbs, clear navigation, summaries always visible." },
  { id: "anxiety", label: "Anxiety", icon: "🫧", cssClass: "mode-anxiety",
    description: "Calm mode — soft colours, gentle transitions, encouraging language, no timers." },

  // --- Motor / Physical ---
  { id: "motor", label: "Motor Impairment", icon: "🖐️", cssClass: "mode-motor",
    description: "Extra-large buttons (56px+), generous spacing, keyboard-friendly navigation." },
  { id: "tremor", label: "Tremor / Parkinson's", icon: "🤲", cssClass: "mode-tremor",
    description: "Very large touch targets, no hover-only actions, sticky tooltips." },
  { id: "dyspraxia", label: "Dyspraxia", icon: "🎯", cssClass: "mode-dyspraxia",
    description: "Larger interactive elements, simplified drag-and-drop, forgiving click zones." },

  // --- Hearing ---
  { id: "hearing", label: "Hearing Impairment / Deaf", icon: "🦻", cssClass: "mode-hearing",
    description: "Visual indicators for audio cues, auto-captions, no sound-only feedback." },

  // --- Other ---
  { id: "screen-reader", label: "Screen Reader / Blind", icon: "🔊", cssClass: "mode-screen-reader",
    description: "Enhanced ARIA labels, skip navigation, semantic structure optimised." },
  { id: "chronic-fatigue", label: "Chronic Fatigue / Low Energy", icon: "🔋", cssClass: "mode-chronic-fatigue",
    description: "Shorter content sections, clear save points, reduced scrolling." },
];

/**
 * Apply accessibility CSS classes to <html> element.
 */
export function applyAccessibilityModes(modes: string[]) {
  const root = document.documentElement;
  ACCESSIBILITY_MODES.forEach(mode => {
    root.classList.toggle(mode.cssClass, modes.includes(mode.id));
  });
}
