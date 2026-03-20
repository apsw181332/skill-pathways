const audioCtx = () => {
  if (!(window as any).__audioCtx) {
    (window as any).__audioCtx = new AudioContext();
  }
  return (window as any).__audioCtx as AudioContext;
};

const playTone = (frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) => {
  const ctx = audioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
};

export const playCorrectSound = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.1);
    gain.gain.setValueAtTime(0.25, now + i * 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.1);
    osc.stop(now + i * 0.1 + 0.3);
  });
};

export const playWrongSound = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  [311.13, 233.08].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + i * 0.15);
    gain.gain.setValueAtTime(0.15, now + i * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.25);
  });
};

export const playClickSound = () => {
  playTone(800, 0.05, "sine", 0.15);
};

export const playSuccessSound = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.12);
    gain.gain.setValueAtTime(0.2, now + i * 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.12);
    osc.stop(now + i * 0.12 + 0.4);
  });
};

/* ────────────────────────────────────────────────────────
   PATH-SPECIFIC ECHO POWER SOUND EFFECTS
   Each path has a unique synthesized sound signature.
   ──────────────────────────────────────────────────────── */

/** Chronos Rewind — ticking clock that reverses */
export const playEchoChronos = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Forward ticks
  [0, 0.12, 0.24].forEach((t) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, now + t);
    gain.gain.setValueAtTime(0.3, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.06);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now + t); osc.stop(now + t + 0.06);
  });
  // Reverse sweep
  const sweep = ctx.createOscillator();
  const sGain = ctx.createGain();
  sweep.type = "sawtooth";
  sweep.frequency.setValueAtTime(800, now + 0.4);
  sweep.frequency.exponentialRampToValueAtTime(200, now + 0.9);
  sGain.gain.setValueAtTime(0.2, now + 0.4);
  sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  sweep.connect(sGain); sGain.connect(ctx.destination);
  sweep.start(now + 0.4); sweep.stop(now + 0.9);
};

/** Syntax Hack — digital glitch / bitcrusher effect */
export const playEchoSyntax = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Rapid staccato square waves at varying frequencies (glitch)
  [440, 880, 220, 660, 330, 990, 550].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    const t = now + i * 0.06;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.04);
  });
  // Descending data noise
  const noise = ctx.createOscillator();
  const nGain = ctx.createGain();
  noise.type = "sawtooth";
  noise.frequency.setValueAtTime(2000, now + 0.45);
  noise.frequency.exponentialRampToValueAtTime(100, now + 0.75);
  nGain.gain.setValueAtTime(0.1, now + 0.45);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
  noise.connect(nGain); nGain.connect(ctx.destination);
  noise.start(now + 0.45); noise.stop(now + 0.75);
};

/** Eloquence Whisper — soft airy whoosh with shimmer */
export const playEchoEloquence = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Breathy sine sweep
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(300, now);
  osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
  osc.frequency.exponentialRampToValueAtTime(400, now + 0.8);
  gain.gain.setValueAtTime(0.0, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.8);
  // Shimmer overtones
  [800, 1200].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(f, now + 0.1 + i * 0.15);
    g.gain.setValueAtTime(0.06, now + 0.1 + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.15);
    o.connect(g); g.connect(ctx.destination);
    o.start(now + 0.1 + i * 0.15); o.stop(now + 0.5 + i * 0.15);
  });
};

/** Treasury Jackpot — coin cascade / slot machine jingle */
export const playEchoTreasury = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Coin clinks: high metallic pings
  [2400, 2800, 3200, 2600, 3000, 3400, 2200, 2900].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const t = now + i * 0.08;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.12);
  });
  // Victory chord
  [523, 659, 784].forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(freq, now + 0.7);
    g.gain.setValueAtTime(0.12, now + 0.7);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    o.connect(g); g.connect(ctx.destination);
    o.start(now + 0.7); o.stop(now + 1.1);
  });
};

/** Vitality Heal — warm rising chime with nature reverb */
export const playEchoVitality = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Warm ascending notes
  [261, 330, 392, 523].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    const t = now + i * 0.15;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.5);
  });
  // Soft harmonic overlay
  const harm = ctx.createOscillator();
  const hGain = ctx.createGain();
  harm.type = "triangle";
  harm.frequency.setValueAtTime(660, now + 0.3);
  hGain.gain.setValueAtTime(0.08, now + 0.3);
  hGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  harm.connect(hGain); hGain.connect(ctx.destination);
  harm.start(now + 0.3); harm.stop(now + 1.0);
};

/** Fortitude Shield — metallic clang + deep resonance */
export const playEchoFortitude = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Impact clang
  const clang = ctx.createOscillator();
  const cGain = ctx.createGain();
  clang.type = "square";
  clang.frequency.setValueAtTime(180, now);
  cGain.gain.setValueAtTime(0.3, now);
  cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  clang.connect(cGain); cGain.connect(ctx.destination);
  clang.start(now); clang.stop(now + 0.15);
  // Metallic ring
  [1100, 1500, 1800].forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, now + 0.05);
    g.gain.setValueAtTime(0.1, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    o.connect(g); g.connect(ctx.destination);
    o.start(now + 0.05); o.stop(now + 0.6);
  });
  // Deep resonant hum
  const hum = ctx.createOscillator();
  const hGain = ctx.createGain();
  hum.type = "sine";
  hum.frequency.setValueAtTime(80, now + 0.1);
  hGain.gain.setValueAtTime(0.15, now + 0.1);
  hGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
  hum.connect(hGain); hGain.connect(ctx.destination);
  hum.start(now + 0.1); hum.stop(now + 0.8);
};

/** Surge Overcharge — electric zap + power surge */
export const playEchoSurge = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Building charge
  const charge = ctx.createOscillator();
  const chGain = ctx.createGain();
  charge.type = "sawtooth";
  charge.frequency.setValueAtTime(100, now);
  charge.frequency.exponentialRampToValueAtTime(2000, now + 0.3);
  chGain.gain.setValueAtTime(0.15, now);
  chGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  charge.connect(chGain); chGain.connect(ctx.destination);
  charge.start(now); charge.stop(now + 0.35);
  // Electric zap burst
  [1500, 2200, 1800, 2500].forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "square";
    const t = now + 0.35 + i * 0.04;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.06);
  });
  // Final boom
  const boom = ctx.createOscillator();
  const bGain = ctx.createGain();
  boom.type = "sine";
  boom.frequency.setValueAtTime(60, now + 0.55);
  bGain.gain.setValueAtTime(0.25, now + 0.55);
  bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  boom.connect(bGain); boom.connect(ctx.destination);
  boom.start(now + 0.55); boom.stop(now + 0.9);
};

/** Unity Bond — warm chord + heartbeat pulse */
export const playEchoUnity = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Warm chord
  [330, 415, 523, 659].forEach((freq) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    o.connect(g); g.connect(ctx.destination);
    o.start(now); o.stop(now + 0.8);
  });
  // Heartbeat pulses
  [0.3, 0.55].forEach((t) => {
    const beat = ctx.createOscillator();
    const bGain = ctx.createGain();
    beat.type = "sine";
    beat.frequency.setValueAtTime(55, now + t);
    bGain.gain.setValueAtTime(0.2, now + t);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
    beat.connect(bGain); bGain.connect(ctx.destination);
    beat.start(now + t); beat.stop(now + t + 0.12);
  });
};

/** Cosmos Vision — ethereal space whoosh + twinkle */
export const playEchoCosmos = () => {
  const ctx = audioCtx();
  const now = ctx.currentTime;
  // Deep space sweep
  const sweep = ctx.createOscillator();
  const sGain = ctx.createGain();
  sweep.type = "sine";
  sweep.frequency.setValueAtTime(80, now);
  sweep.frequency.exponentialRampToValueAtTime(400, now + 0.5);
  sweep.frequency.exponentialRampToValueAtTime(200, now + 1.0);
  sGain.gain.setValueAtTime(0.0, now);
  sGain.gain.linearRampToValueAtTime(0.12, now + 0.3);
  sGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  sweep.connect(sGain); sGain.connect(ctx.destination);
  sweep.start(now); sweep.stop(now + 1.0);
  // Twinkle stars
  [1200, 1600, 2000, 1400, 1800].forEach((freq, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    const t = now + 0.2 + i * 0.12;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.08, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.connect(g); g.connect(ctx.destination);
    o.start(t); o.stop(t + 0.2);
  });
};

/** Play the echo sound for a specific path */
export const playEchoSound = (pathId: string) => {
  const soundMap: Record<string, () => void> = {
    chronos: playEchoChronos,
    syntax: playEchoSyntax,
    eloquence: playEchoEloquence,
    treasury: playEchoTreasury,
    vitality: playEchoVitality,
    fortitude: playEchoFortitude,
    surge: playEchoSurge,
    unity: playEchoUnity,
    cosmos: playEchoCosmos,
  };
  const fn = soundMap[pathId];
  if (fn) fn();
  else playSuccessSound();
};
