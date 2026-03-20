import { AnimatePresence, motion } from "framer-motion";
import { NINE_PATHS } from "@/lib/paths";
import { useEffect, useRef, useState, useCallback } from "react";

interface CorrectEffectProps {
  pathId: string | null;
  active: boolean;
}

interface EndLessonEffectProps {
  pathId: string | null;
  active: boolean;
  onComplete?: () => void;
}

interface EchoEffectProps {
  pathId: string | null;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/*  CSS-based particle engine (inspired by user's HTML/CSS system)    */
/* ------------------------------------------------------------------ */

const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === "undefined") return;
    injected = true;
    const style = document.createElement("style");
    style.textContent = `
      .fx-particle {
        position: absolute; pointer-events: none;
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-family: monospace;
        will-change: transform, opacity;
        animation: fx-explode var(--dur) cubic-bezier(0.1, 0.8, 0.2, 1) forwards;
      }
      @keyframes fx-explode {
        0% { opacity: 1; transform: translate(0,0) scale(var(--start-scale)) rotate(0deg); }
        70% { opacity: 1; }
        100% { opacity: 0; transform: translate(var(--px), var(--py)) scale(var(--end-scale)) rotate(var(--rot)); }
      }

      .fx-rain-drop {
        position: absolute; pointer-events: none;
        display: flex; align-items: center; justify-content: center;
        font-weight: bold; font-family: monospace;
        will-change: transform, opacity; opacity: 0;
        animation: fx-rainFall var(--dur) linear forwards;
        animation-delay: var(--delay);
      }
      @keyframes fx-rainFall {
        0% { opacity: 0; transform: translate(var(--rx), -20vh) rotate(0deg); }
        10% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; transform: translate(var(--rx), 110vh) rotate(var(--rot)); }
      }

      .fx-matrix-rain {
        position: absolute; pointer-events: none;
        color: #22c55e; font-size: 1.6rem; font-family: monospace;
        writing-mode: vertical-rl;
        animation: fx-textRainDown 1s linear forwards;
      }
      @keyframes fx-textRainDown {
        0% { transform: translateY(-100vh); opacity: 0; }
        10%, 90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
      }

      .fx-build-up {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        animation: fx-buildUp 3s ease-in forwards;
      }
      @keyframes fx-buildUp {
        0% { transform: translate(-50%,-50%) scale(0); opacity: 0; }
        20%, 80% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
        98% { transform: translate(-50%,-50%) scale(1.5); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
      }

      .fx-build-up-spin {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        animation: fx-buildUpSpin 3s ease-in forwards;
      }
      @keyframes fx-buildUpSpin {
        0% { transform: translate(-50%,-50%) scale(0) rotate(0); opacity: 0; }
        20%, 80% { transform: translate(-50%,-50%) scale(1) rotate(720deg); opacity: 1; }
        98% { transform: translate(-50%,-50%) scale(1.5) rotate(1440deg); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2) rotate(1600deg); opacity: 0; }
      }

      .fx-singularity {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        width: 10px; height: 10px; background: #000; border-radius: 50%;
        animation: fx-singularity 3s ease-in forwards;
      }
      @keyframes fx-singularity {
        0% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
        30%, 80% { transform: translate(-50%,-50%) scale(150); background: #fff; box-shadow: 0 0 100px #fff; opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(400); opacity: 0; }
      }

      .fx-pop-in-out {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        animation: fx-popInOut 1.2s forwards;
      }
      @keyframes fx-popInOut {
        0% { transform: translate(-50%,-50%) scale(0); opacity: 0; }
        40%, 60% { transform: translate(-50%,-50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(1.5); opacity: 0; }
      }

      .fx-zap {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        animation: fx-popInOutZap 0.6s forwards;
      }
      @keyframes fx-popInOutZap {
        0% { transform: translate(-50%,-50%) scale(0) skewX(40deg); opacity: 0; }
        50% { transform: translate(-50%,-50%) scale(1.5) skewX(-20deg); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
      }

      .fx-time-ripple {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        border: 4px solid #3b82f6; border-radius: 50%;
        animation: fx-timeRipple 1s ease-out forwards;
      }
      @keyframes fx-timeRipple {
        0% { width: 0; height: 0; opacity: 1; }
        100% { width: 500px; height: 500px; opacity: 0; border-width: 1px; }
      }

      .fx-heart-beat {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        animation: fx-thumping 1.5s forwards;
      }
      @keyframes fx-thumping {
        0% { transform: translate(-50%,-50%) scale(0); opacity: 0; }
        50% { transform: translate(-50%,-50%) scale(1.5); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
      }

      .fx-cosmic-swirl {
        position: absolute; pointer-events: none;
        left: 50%; top: 50%; transform: translate(-50%, -50%);
        display: flex; align-items: center; justify-content: center;
        animation: fx-cosmicSwirl 1.5s forwards;
      }
      @keyframes fx-cosmicSwirl {
        0% { transform: translate(-50%,-50%) scale(0) rotate(0); opacity: 0; }
        50% { transform: translate(-50%,-50%) scale(1.5) rotate(180deg); opacity: 1; }
        100% { transform: translate(-50%,-50%) scale(2) rotate(360deg); opacity: 0; }
      }

      .fx-screen-shake { animation: fx-shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }
      @keyframes fx-shake {
        0%, 100% { transform: translate(0,0); }
        10%, 90% { transform: translate(-15px,-15px); }
        20%, 80% { transform: translate(20px,15px); }
        30%, 50%, 70% { transform: translate(-25px,20px); }
        40%, 60% { transform: translate(25px,-20px); }
      }

      .fx-flash-white { animation: fx-flashWhite 0.8s ease-out forwards; }
      @keyframes fx-flashWhite {
        0%, 10% { background: rgba(255,255,255,0.9); }
        100% { background: transparent; }
      }
    `;
    document.head.appendChild(style);
  };
})();

/* ------------------------------------------------------------------ */
/*  Particle engine using direct DOM for performance                  */
/* ------------------------------------------------------------------ */

function useParticleStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    injectStyles();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  const clearStage = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    if (stageRef.current) stageRef.current.innerHTML = "";
    if (containerRef.current) containerRef.current.className = "fixed inset-0 z-[92] pointer-events-none overflow-hidden";
  }, []);

  const setTimer = useCallback((fn: () => void, delay: number) => {
    timeoutsRef.current.push(window.setTimeout(fn, delay));
  }, []);

  const triggerExplosionAndRain = useCallback((
    expElements: string[], rainElements: string[], colors: string[]
  ) => {
    const stage = stageRef.current;
    const container = containerRef.current;
    if (!stage || !container) return;

    container.classList.add("fx-screen-shake", "fx-flash-white");

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < 80; i++) {
      const el = document.createElement("div");
      el.className = "fx-particle";
      if (expElements.length > 0) el.innerText = expElements[Math.floor(Math.random() * expElements.length)];

      const angle = Math.random() * Math.PI * 2;
      const distance = 200 + Math.random() * 800;
      const px = Math.cos(angle) * distance;
      const py = Math.sin(angle) * distance;
      const size = 15 + Math.random() * 25;
      const color = colors[Math.floor(Math.random() * colors.length)];

      el.style.fontSize = `${size}px`;
      el.style.color = color;
      el.style.left = "50%";
      el.style.top = "50%";

      if (expElements.length === 0) {
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.background = color;
        el.style.borderRadius = "50%";
      }

      el.style.setProperty("--px", `${px}px`);
      el.style.setProperty("--py", `${py}px`);
      el.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      el.style.setProperty("--dur", `${1.2 + Math.random() * 1.5}s`);
      el.style.setProperty("--start-scale", String(Math.random() > 0.5 ? 1 : 1.5));
      el.style.setProperty("--end-scale", String(Math.random() * 0.5));

      fragment.appendChild(el);
    }

    stage.appendChild(fragment);

    setTimer(() => {
      const rainFrag = document.createDocumentFragment();
      for (let i = 0; i < 60; i++) {
        const el = document.createElement("div");
        el.className = "fx-rain-drop";
        if (rainElements.length > 0) el.innerText = rainElements[Math.floor(Math.random() * rainElements.length)];

        const rx = (Math.random() * 100 - 50) + "vw";
        const size = 15 + Math.random() * 20;
        const color = colors[Math.floor(Math.random() * colors.length)];

        el.style.fontSize = `${size}px`;
        el.style.color = color;
        el.style.left = "50%";
        el.style.top = "0";

        if (rainElements.length === 0) {
          el.style.width = `${size / 2}px`;
          el.style.height = `${size / 2}px`;
          el.style.background = color;
          el.style.borderRadius = "50%";
        }

        el.style.setProperty("--rx", rx);
        el.style.setProperty("--rot", `${Math.random() * 360}deg`);
        el.style.setProperty("--dur", `${2 + Math.random() * 2}s`);
        el.style.setProperty("--delay", `${Math.random() * 1.5}s`);

        rainFrag.appendChild(el);
      }
      stage.appendChild(rainFrag);
    }, 800);
  }, [setTimer]);

  return { stageRef, containerRef, clearStage, setTimer, triggerExplosionAndRain };
}

/* ------------------------------------------------------------------ */
/*  Path-specific correct answer effects (short ~1.2s)                */
/* ------------------------------------------------------------------ */

const pathCorrectConfigs: Record<string, { className: string; emoji: string; fontSize: string }> = {
  syntax:    { className: "matrix-rain", emoji: "", fontSize: "2rem" },
  treasury:  { className: "fx-pop-in-out", emoji: "🪙", fontSize: "6rem" },
  vitality:  { className: "fx-pop-in-out", emoji: "🍃", fontSize: "5rem" },
  chronos:   { className: "fx-time-ripple", emoji: "", fontSize: "" },
  fortitude: { className: "fx-pop-in-out", emoji: "🛡️", fontSize: "6rem" },
  surge:     { className: "fx-zap", emoji: "⚡", fontSize: "8rem" },
  unity:     { className: "fx-heart-beat", emoji: "💖", fontSize: "8rem" },
  cosmos:    { className: "fx-cosmic-swirl", emoji: "✨", fontSize: "8rem" },
  eloquence: { className: "fx-pop-in-out", emoji: "✨", fontSize: "5rem" },
};

const CorrectEffect = ({ pathId, active }: CorrectEffectProps) => {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (!active || !pathId || !stageRef.current) return;
    const stage = stageRef.current;
    stage.innerHTML = "";

    if (pathId === "syntax") {
      // Matrix rain streaks
      for (let i = 0; i < 6; i++) {
        const streak = document.createElement("div");
        streak.className = "fx-matrix-rain";
        streak.innerText = Math.random().toString(2).substr(2, 6);
        streak.style.left = `${Math.random() * 100}%`;
        streak.style.animationDelay = `${Math.random() * 0.2}s`;
        stage.appendChild(streak);
      }
    } else if (pathId === "chronos") {
      const ring = document.createElement("div");
      ring.className = "fx-time-ripple";
      stage.appendChild(ring);
    } else {
      const config = pathCorrectConfigs[pathId] || pathCorrectConfigs.cosmos;
      const el = document.createElement("div");
      el.className = config.className;
      el.innerText = config.emoji;
      el.style.fontSize = config.fontSize;
      stage.appendChild(el);
    }

    const timer = setTimeout(() => { stage.innerHTML = ""; }, 1500);
    return () => clearTimeout(timer);
  }, [active, pathId]);

  if (!active || !pathId) return null;

  return (
    <div className="fixed inset-0 z-[88] pointer-events-none overflow-hidden" ref={stageRef} />
  );
};

/* ------------------------------------------------------------------ */
/*  Echo-of-Path effect                                                */
/* ------------------------------------------------------------------ */

export const EchoEffect = ({ pathId, active }: EchoEffectProps) => {
  if (!active || !pathId) return null;

  const echoGlyphs: Record<string, string[]> = {
    chronos:   ["⟲", "◴", "◌", "◇"],
    syntax:    ["</>", "0", "1", "//"],
    eloquence: ["✦", "✧", "A", "語"],
    treasury:  ["$", "◈", "✧", "€"],
    vitality:  ["❀", "✿", "☘", "❋"],
    fortitude: ["⬢", "◆", "◈", "▣"],
    surge:     ["╱", "╲", "✦", "◇"],
    unity:     ["◌", "◎", "•", "◇"],
    cosmos:    ["✧", "✹", "✶", "◇"],
  };
  const g = echoGlyphs[pathId] || echoGlyphs.cosmos;
  const W = typeof window !== "undefined" ? window.innerWidth : 800;
  const cx = W / 2;
  const cy = (typeof window !== "undefined" ? window.innerHeight : 600) / 2;

  const particles = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 40 + Math.random() * Math.max(W, 600) * 0.4;
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: Math.random() * 0.25, s: 16 + Math.random() * 24, rot: -180 + Math.random() * 360 };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[89] pointer-events-none overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-primary/15"
        />
        <motion.div
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 3], opacity: [0.7, 0] }}
          transition={{ duration: 1 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40"
          style={{ width: W * 0.4, height: W * 0.4 }}
        />
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: cx, y: cy, scale: 0, opacity: 0 }}
            animate={{ x: cx + p.x, y: cy + p.y, scale: [0, 1.3, 0.4], opacity: [0, 1, 0], rotate: p.rot }}
            transition={{ duration: 0.9, delay: p.d }}
            className="absolute font-bold"
            style={{ fontSize: p.s, color: "hsl(var(--primary))", textShadow: "0 0 10px hsl(var(--primary)/0.4)" }}
          >
            {g[p.id % g.length]}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

/* ------------------------------------------------------------------ */
/*  End-lesson effects — full CSS particle system with build-up,      */
/*  explosion, rain, then smooth reveal of completion page             */
/* ------------------------------------------------------------------ */

interface PathEndConfig {
  buildClass: string;
  buildContent: string;
  buildFontSize: string;
  expElements: string[];
  rainElements: string[];
  colors: string[];
  preEffect?: (stage: HTMLDivElement) => void;
}

const pathEndConfigs: Record<string, PathEndConfig> = {
  syntax: {
    buildClass: "fx-build-up",
    buildContent: "",
    buildFontSize: "1.5rem",
    expElements: ["{", "}", ";", "/", "<>"],
    rainElements: ["0", "1"],
    colors: ["#06b6d4", "#22d3ee"],
    preEffect: (stage) => {
      // Matrix rain before build-up
      for (let i = 0; i < 8; i++) {
        const streak = document.createElement("div");
        streak.className = "fx-matrix-rain";
        streak.innerText = Math.random().toString(2).substr(2, 8);
        streak.style.left = `${Math.random() * 100}%`;
        streak.style.animationDelay = `${Math.random() * 0.3}s`;
        stage.appendChild(streak);
      }
    },
  },
  treasury: {
    buildClass: "fx-build-up",
    buildContent: "🧰",
    buildFontSize: "10rem",
    expElements: ["💎", "💰", "✨"],
    rainElements: ["🪙", "✨"],
    colors: ["#facc15", "#fde047"],
  },
  vitality: {
    buildClass: "fx-build-up",
    buildContent: "🌳",
    buildFontSize: "12rem",
    expElements: ["🌸", "🌺", "🌱"],
    rainElements: ["🍃", "🦋"],
    colors: ["#4ade80", "#22c55e"],
  },
  chronos: {
    buildClass: "fx-build-up-spin",
    buildContent: "⏳",
    buildFontSize: "12rem",
    expElements: ["⏳", "🌀", "⌚"],
    rainElements: ["✨", "⌛"],
    colors: ["#60a5fa", "#93c5fd"],
  },
  fortitude: {
    buildClass: "fx-build-up",
    buildContent: "🛡️",
    buildFontSize: "16rem",
    expElements: ["⚔️", "🧱", "💥"],
    rainElements: ["🛡️", "✨"],
    colors: ["#fbbf24", "#f59e0b"],
  },
  surge: {
    buildClass: "fx-build-up",
    buildContent: "⚡",
    buildFontSize: "20rem",
    expElements: ["💥", "🌩️"],
    rainElements: ["⚡", "🌧️"],
    colors: ["#38bdf8", "#e0f2fe"],
  },
  unity: {
    buildClass: "fx-build-up",
    buildContent: "",
    buildFontSize: "",
    expElements: ["🤝", "💞", "✨"],
    rainElements: ["❤️", "💖"],
    colors: ["#f43f5e", "#fb7185"],
    preEffect: (stage) => {
      // Glowing node
      const node = document.createElement("div");
      node.className = "fx-build-up";
      node.style.width = "80px";
      node.style.height = "80px";
      node.style.background = "#fff";
      node.style.borderRadius = "50%";
      node.style.boxShadow = "0 0 80px #f43f5e";
      stage.appendChild(node);
    },
  },
  cosmos: {
    buildClass: "fx-singularity",
    buildContent: "",
    buildFontSize: "",
    expElements: ["☄️", "🌟", "🌌"],
    rainElements: ["✨", "⭐"],
    colors: ["#c084fc", "#e879f9", "#fff"],
  },
  eloquence: {
    buildClass: "fx-build-up",
    buildContent: "📜",
    buildFontSize: "10rem",
    expElements: ["✦", "✧", "語", "A"],
    rainElements: ["✨", "✦"],
    colors: ["#a78bfa", "#c4b5fd"],
  },
};

export const EndLessonEffect = ({ pathId, active, onComplete }: EndLessonEffectProps) => {
  const { stageRef, containerRef, clearStage, setTimer, triggerExplosionAndRain } = useParticleStage();
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    if (!active || !pathId) return;

    const config = pathEndConfigs[pathId] || pathEndConfigs.cosmos;
    const stage = stageRef.current;
    if (!stage) return;

    stage.innerHTML = "";

    // Pre-effect (matrix rain, glowing node, etc.)
    if (config.preEffect) {
      config.preEffect(stage);
    }

    // Build-up element (the main icon that scales up)
    if (config.buildContent || config.buildClass === "fx-singularity") {
      const buildEl = document.createElement("div");
      buildEl.className = config.buildClass;
      if (config.buildContent) {
        buildEl.innerText = config.buildContent;
        buildEl.style.fontSize = config.buildFontSize;
      }
      stage.appendChild(buildEl);
    }

    // At 3s, trigger explosion + rain
    setTimer(() => {
      triggerExplosionAndRain(config.expElements, config.rainElements, config.colors);
    }, 3000);

    // At 4s, start revealing the completion page behind
    setTimer(() => {
      setShowReveal(true);
    }, 4000);

    // At 7.5s, clear everything
    setTimer(() => {
      clearStage();
      if (onComplete) onComplete();
    }, 7500);

    return () => clearStage();
  }, [active, pathId]);

  if (!active || !pathId) return null;

  const path = NINE_PATHS.find(p => p.id === pathId);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-[92] pointer-events-none overflow-hidden"
        style={{ background: showReveal ? "transparent" : "hsl(var(--background))" }}
      >
        <div ref={stageRef} className="w-full h-full relative" />

        {/* Path name overlay */}
        {path && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.8 }}
            animate={{ opacity: [0, 0, 1, 1, 0], y: [30, 30, 0, 0, -15], scale: [0.8, 0.8, 1.1, 1.05, 1] }}
            transition={{ duration: 3.6, times: [0, 0.2, 0.35, 0.8, 1] }}
            className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center z-10"
          >
            <div className="text-6xl mb-3" style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary)/0.5))" }}>
              {path.emoji}
            </div>
            <h2 className="text-3xl font-bold text-foreground" style={{ textShadow: "0 2px 20px hsl(var(--background)/0.8)" }}>
              {path.name}
            </h2>
            <p className="text-base text-muted-foreground mt-2" style={{ textShadow: "0 1px 10px hsl(var(--background)/0.9)" }}>
              {path.endLessonDescription}
            </p>
          </motion.div>
        )}
      </div>

      {/* Smooth reveal transition — fades background from opaque to transparent */}
      {showReveal && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="fixed inset-0 z-[91] pointer-events-none"
          style={{ background: "hsl(var(--background))" }}
        />
      )}
    </>
  );
};

export default CorrectEffect;
