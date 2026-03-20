import { AnimatePresence, motion } from "framer-motion";
import { NINE_PATHS } from "@/lib/paths";
import { useEffect, useState } from "react";

interface CorrectEffectProps {
  pathId: string | null;
  active: boolean;
}

interface EndLessonEffectProps {
  pathId: string | null;
  active: boolean;
}

interface EchoEffectProps {
  pathId: string | null;
  active: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const vw = () => typeof window === "undefined" ? 800 : window.innerWidth;
const vh = () => typeof window === "undefined" ? 600 : window.innerHeight;
const vc = () => ({ x: vw() / 2, y: vh() / 2 });

const ring = (count: number, minR: number, maxR: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const r = minR + Math.random() * (maxR - minR);
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: Math.random() * 0.25, s: 16 + Math.random() * 24, rot: -180 + Math.random() * 360 };
  });

const spiral = (count: number, turns: number, maxR: number) =>
  Array.from({ length: count }, (_, i) => {
    const t = i / count;
    const a = t * turns * Math.PI * 2;
    const r = t * maxR;
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: t * 0.4, s: 14 + Math.random() * 18 };
  });

const scatter = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * vw() * 1.2,
    y: (Math.random() - 0.5) * vh() * 1.2,
    d: Math.random() * 0.4,
    s: 18 + Math.random() * 28,
    rot: Math.random() * 720 - 360,
  }));

/* Path-specific color classes mapped to semantic tokens */
const pathGlow: Record<string, string> = {
  syntax: "bg-primary/30",
  eloquence: "bg-accent/30",
  treasury: "bg-accent/40",
  vitality: "bg-primary/30",
  chronos: "bg-accent/30",
  fortitude: "bg-foreground/15",
  surge: "bg-accent/40",
  unity: "bg-primary/25",
  cosmos: "bg-primary/35",
};

/* ------------------------------------------------------------------ */
/*  FULL-PAGE Correct-answer effects (short ~0.8s)                    */
/* ------------------------------------------------------------------ */

const CorrectEffect = ({ pathId, active }: CorrectEffectProps) => {
  if (!active || !pathId) return null;
  const path = NINE_PATHS.find(p => p.id === pathId);
  if (!path) return null;
  const c = vc();
  const burst = ring(36, 80, Math.max(vw(), vh()) * 0.6);
  const W = vw();
  const H = vh();

  const glyphs: Record<string, string[]> = {
    syntax:    ["0", "1", "</>", "{}", "=>", "//", "&&", "++"],
    eloquence: ["✦", "A", "文", "語", "✧", "言", "Mot"],
    treasury:  ["$", "✦", "◈", "✧", "₿", "€", "¥"],
    vitality:  ["❀", "✿", "❋", "☘", "✤"],
    chronos:   ["◆", "◴", "◌", "◇", "◎"],
    fortitude: ["⬢", "◈", "◆", "▣", "✦"],
    surge:     ["╱", "╲", "✦", "✧", "◇"],
    unity:     ["◌", "◎", "•", "✦", "◇"],
    cosmos:    ["✧", "✹", "✦", "✶", "◇"],
  };
  const g = glyphs[pathId] || glyphs.syntax;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[88] pointer-events-none overflow-hidden"
      >
        {/* FULL-SCREEN flash */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{ duration: 0.5 }}
          className={`absolute inset-0 ${pathGlow[pathId] || "bg-primary/20"}`}
        />

        {/* Massive center glow — covers whole viewport */}
        <motion.div
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: [0.1, 3, 6], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.8 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ width: W * 0.6, height: W * 0.6, background: `radial-gradient(circle, hsl(var(--primary)/0.5), transparent 70%)` }}
        />

        {/* Triple expanding rings */}
        {[0, 1, 2].map(r => (
          <motion.div
            key={r}
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: [0.1, 2 + r * 0.5, 4 + r], opacity: [0, 0.7, 0] }}
            transition={{ duration: 0.75, delay: r * 0.05 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/50"
            style={{ width: W * 0.3, height: W * 0.3 }}
          />
        ))}

        {/* Full-page burst particles flying to edges */}
        {burst.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: c.x, y: c.y, scale: 0, opacity: 0, rotate: 0 }}
            animate={{ x: c.x + p.x, y: c.y + p.y, scale: [0, 1.4, 0], opacity: [0, 1, 0], rotate: p.rot }}
            transition={{ duration: 0.75, delay: p.d, ease: "easeOut" }}
            className="absolute font-bold"
            style={{ fontSize: p.s, color: "hsl(var(--primary))", textShadow: "0 0 12px hsl(var(--primary)/0.5)" }}
          >
            {g[p.id % g.length]}
          </motion.div>
        ))}

        {/* Edge streaks — lines shooting from center to corners */}
        {[
          { x: 0, y: 0 }, { x: W, y: 0 }, { x: 0, y: H }, { x: W, y: H },
          { x: W / 2, y: 0 }, { x: W / 2, y: H }, { x: 0, y: H / 2 }, { x: W, y: H / 2 },
        ].map((target, i) => (
          <motion.div
            key={`streak-${i}`}
            initial={{ x: c.x, y: c.y, scaleX: 0, opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0], scaleX: [0, 1, 1] }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="absolute h-[2px] origin-left"
            style={{
              width: Math.sqrt((target.x - c.x) ** 2 + (target.y - c.y) ** 2),
              transform: `rotate(${Math.atan2(target.y - c.y, target.x - c.x)}rad)`,
              background: `linear-gradient(90deg, hsl(var(--primary)/0.6), transparent)`,
            }}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

/* ------------------------------------------------------------------ */
/*  Echo-of-Path effect — FULL-PAGE with path-specific visuals        */
/* ------------------------------------------------------------------ */

export const EchoEffect = ({ pathId, active }: EchoEffectProps) => {
  if (!active || !pathId) return null;
  const c = vc();
  const W = vw();
  const H = vh();
  const particles = ring(18, 40, Math.max(W, H) * 0.4);

  const echoGlyphs: Record<string, string[]> = {
    chronos:   ["⟲", "◴", "◌", "◇"],
    syntax:    ["</>", "0", "1", "//", "{}"],
    eloquence: ["✦", "✧", "A", "語"],
    treasury:  ["$", "◈", "✧", "€"],
    vitality:  ["❀", "✿", "☘", "❋"],
    fortitude: ["⬢", "◆", "◈", "▣"],
    surge:     ["╱", "╲", "✦", "◇"],
    unity:     ["◌", "◎", "•", "◇"],
    cosmos:    ["✧", "✹", "✶", "◇"],
  };
  const g = echoGlyphs[pathId] || echoGlyphs.cosmos;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[89] pointer-events-none overflow-hidden"
      >
        {/* Full screen pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.15, 0] }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 ${pathGlow[pathId] || "bg-primary/15"}`}
        />

        {/* Large expanding ring */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 3], opacity: [0.7, 0] }}
          transition={{ duration: 1 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/40"
          style={{ width: W * 0.4, height: W * 0.4 }}
        />

        {/* Particles fly outward to fill screen */}
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
            animate={{ x: c.x + p.x, y: c.y + p.y, scale: [0, 1.3, 0.4], opacity: [0, 1, 0], rotate: p.rot }}
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
/*  End-lesson effects (3-4s, spectacular, FULL PAGE per path)        */
/* ------------------------------------------------------------------ */

/* ----- CHRONOS: Golden clock → time spiral → MASSIVE explosion ---- */
const EndChronos = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const timeParticles = scatter(50);
  const spiralParts = spiral(24, 2.5, Math.min(W, H) * 0.35);
  const clockMarks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { id: i, x: Math.cos(a) * 90, y: Math.sin(a) * 90 };
  });

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.2, 0] }} transition={{ duration: 1.5 }} className="absolute inset-0 bg-foreground/10" />

      {/* Giant golden clock */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0.8] }}
        transition={{ duration: 1.4, times: [0, 0.4, 0.6, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, ease: "linear" }}
          className="rounded-full border-[6px] border-accent/70 relative"
          style={{ width: 200, height: 200, boxShadow: "0 0 80px hsl(var(--accent)/0.5), 0 0 160px hsl(var(--accent)/0.25), inset 0 0 40px hsl(var(--accent)/0.15)" }}
        >
          {clockMarks.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: [0, 1] }} transition={{ delay: 0.3 + m.id * 0.04 }}
              className="absolute w-3 h-3 rounded-full bg-accent/80"
              style={{ left: 90 + m.x, top: 90 + m.y }} />
          ))}
          <motion.div initial={{ rotate: 0 }} animate={{ rotate: [0, 360, 720, 1080] }}
            transition={{ duration: 1.6, ease: [0.2, 0.8, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 origin-bottom -translate-x-1/2"
            style={{ width: 4, height: 60, bottom: "50%", background: "hsl(var(--accent))", borderRadius: 4, boxShadow: "0 0 10px hsl(var(--accent)/0.8)" }} />
          <motion.div initial={{ rotate: 90 }} animate={{ rotate: [90, 270, 450] }}
            transition={{ duration: 1.6, ease: [0.2, 0.8, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 origin-bottom -translate-x-1/2"
            style={{ width: 4, height: 40, bottom: "50%", background: "hsl(var(--accent)/0.7)", borderRadius: 4 }} />
        </motion.div>
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-accent"
          style={{ boxShadow: "0 0 16px hsl(var(--accent)/0.9)" }} />
      </motion.div>

      {/* Time spiral */}
      {spiralParts.map(sp => (
        <motion.div key={`sp-${sp.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + sp.x, y: c.y + sp.y, opacity: [0, 0.9, 0.7, 0], scale: [0, 1.2, 0.8, 0] }}
          transition={{ duration: 2.4, delay: 0.6 + sp.d }}
          className="absolute" style={{ fontSize: sp.s, color: "hsl(var(--accent))", textShadow: "0 0 8px hsl(var(--accent)/0.5)" }}>
          {["◆", "◴", "◌", "◇", "◎"][sp.id % 5]}
        </motion.div>
      ))}

      {/* MASSIVE explosion covering full screen */}
      {timeParticles.map(tp => (
        <motion.div key={`tp-${tp.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + tp.x, y: c.y + tp.y, opacity: [0, 0, 1, 0], scale: [0, 0, 1.5, 0], rotate: tp.rot }}
          transition={{ duration: 3.4, delay: 1.5 + tp.d * 0.5, times: [0, 0.45, 0.65, 1] }}
          className="absolute" style={{ fontSize: tp.s, color: "hsl(var(--accent))", textShadow: "0 0 8px hsl(var(--accent)/0.4)" }}>
          {["◆", "◴", "◌", "◇", "◎", "✦"][tp.id % 6]}
        </motion.div>
      ))}

      {/* Full-screen flash on explosion */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.6, 0] }}
        transition={{ duration: 3.4, times: [0, 0.47, 0.55, 0.8] }}
        className="absolute inset-0 bg-accent/20" />

      {/* Expanding rings */}
      {[0, 1, 2, 3].map(r => (
        <motion.div key={`ring-${r}`}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 0.2, 3 + r * 0.6], opacity: [0, 0, 0.5, 0] }}
          transition={{ duration: 3.4, delay: r * 0.08, times: [0, 0.47, 0.65, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/40"
          style={{ width: W * 0.3, height: W * 0.3 }} />
      ))}
    </>
  );
};

/* ----- SYNTAX: Matrix code rain → hologram wall → flash ---------- */
const EndSyntax = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const codeChars = ["0", "1", "</>", "{}", "[]", "=>", "&&", "||", "++", "fn", "#", "//"];
  const numColumns = Math.ceil(W / 35);
  const rainColumns = Array.from({ length: numColumns }, (_, i) => ({
    id: i, x: -W / 2 + i * 35, delay: Math.random() * 0.5,
  }));
  const burstParts = scatter(40);
  const wallCells = Array.from({ length: 36 }, (_, i) => ({
    id: i, x: -200 + (i % 6) * 70, y: -120 + Math.floor(i / 6) * 45, delay: 1.0 + Math.random() * 0.4,
  }));

  return (
    <>
      {/* Full-screen code rain */}
      {rainColumns.map(col => (
        <motion.div key={`rain-${col.id}`}
          initial={{ x: c.x + col.x, y: -30, opacity: 0 }}
          animate={{ y: [H + 50], opacity: [0, 0.9, 0.7, 0] }}
          transition={{ duration: 2, delay: col.delay, ease: "linear" }}
          className="absolute font-mono" style={{ fontSize: 14, color: "hsl(var(--primary))", textShadow: "0 0 6px hsl(var(--primary)/0.5)" }}>
          {Array.from({ length: Math.ceil(H / 20) }, (_, j) => (
            <div key={j} className="mb-1">{codeChars[(col.id + j) % codeChars.length]}</div>
          ))}
        </motion.div>
      ))}

      {/* Hologram wall */}
      {wallCells.map(cell => (
        <motion.div key={`wall-${cell.id}`}
          initial={{ x: c.x + cell.x + (Math.random() - 0.5) * 300, y: c.y + cell.y + (Math.random() - 0.5) * 300, opacity: 0, scale: 0 }}
          animate={{ x: c.x + cell.x, y: c.y + cell.y, opacity: [0, 0, 0.9, 0.9, 0], scale: [0, 0, 1, 1, 0.5] }}
          transition={{ duration: 3.4, delay: cell.delay * 0.5, times: [0, 0.28, 0.42, 0.75, 1] }}
          className="absolute font-mono rounded px-2 py-1"
          style={{ fontSize: 14, color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)", border: "1px solid hsl(var(--primary)/0.25)" }}>
          {codeChars[cell.id % codeChars.length]}
        </motion.div>
      ))}

      {/* Full-screen flash */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: 3.4, times: [0, 0.7, 0.82, 1] }}
        className="absolute inset-0 bg-primary/15" />

      {/* Massive particle burst */}
      {burstParts.map(bp => (
        <motion.div key={`sb-${bp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, scale: [0, 0, 1.4, 0], opacity: [0, 0, 1, 0], rotate: bp.rot }}
          transition={{ duration: 3.4, times: [0, 0.72, 0.85, 1] }}
          className="absolute font-mono"
          style={{ fontSize: bp.s, color: "hsl(var(--primary))", textShadow: "0 0 8px hsl(var(--primary)/0.5)" }}>
          {codeChars[bp.id % codeChars.length]}
        </motion.div>
      ))}
    </>
  );
};

/* ----- ELOQUENCE: Floating words → shining arc ------------------- */
const EndEloquence = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const words = ["Words", "語", "Parole", "Слова", "كلمات", "言葉", "Mot", "Wort", "Lingua", "✦", "✧", "Verba"];
  const arcParts = spiral(22, 0.6, Math.min(W, H) * 0.35);
  const burst = scatter(35);

  return (
    <>
      {/* Words float up from all edges */}
      {words.map((w, i) => (
        <motion.div key={`word-${i}`}
          initial={{ x: (Math.random()) * W, y: H + 50, opacity: 0 }}
          animate={{ y: -50, opacity: [0, 0.9, 0.7, 0], rotate: [-5 + Math.random() * 10] }}
          transition={{ duration: 2.5, delay: i * 0.12 }}
          className="absolute font-semibold"
          style={{ fontSize: 18 + Math.random() * 16, color: "hsl(var(--accent))", textShadow: "0 0 10px hsl(var(--accent)/0.4)" }}>
          {w}
        </motion.div>
      ))}

      {/* Arc forms */}
      {arcParts.map(ap => (
        <motion.div key={`arc-${ap.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + ap.x, y: c.y + ap.y - 60, opacity: [0, 0, 1, 0.8, 0], scale: [0, 0, 1.3, 1, 0] }}
          transition={{ duration: 3.4, delay: ap.d, times: [0, 0.3, 0.5, 0.8, 1] }}
          className="absolute" style={{ fontSize: ap.s, color: "hsl(var(--accent))", textShadow: "0 0 8px hsl(var(--accent)/0.4)" }}>
          {words[ap.id % words.length]}
        </motion.div>
      ))}

      {/* Full-screen burst */}
      {burst.map(bp => (
        <motion.div key={`eb-${bp.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, opacity: [0, 0, 1, 0], scale: [0, 0, 1.3, 0], rotate: bp.rot }}
          transition={{ duration: 3.4, times: [0, 0.6, 0.78, 1] }}
          className="absolute" style={{ fontSize: bp.s, color: "hsl(var(--accent)/0.7)" }}>✦</motion.div>
      ))}

      {/* Glow arc - wide */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 0, 1.4, 1.1, 0], opacity: [0, 0, 0.7, 0.5, 0] }}
        transition={{ duration: 3.4, times: [0, 0.3, 0.55, 0.8, 1] }}
        className="absolute left-1/2 top-[35%] -translate-x-1/2 h-4 rounded-full blur-lg"
        style={{ width: W * 0.8, background: "hsl(var(--accent)/0.3)" }} />
    </>
  );
};

/* ----- TREASURY: Chest → gold coins everywhere → light rays ------ */
const EndTreasury = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const coins = scatter(45);
  const rays = Array.from({ length: 16 }, (_, i) => ({ id: i, angle: (i / 16) * Math.PI * 2 }));

  return (
    <>
      {/* Giant chest shakes */}
      <motion.div
        initial={{ scale: 0, y: c.y, x: c.x - 50 }}
        animate={{ scale: [0, 1.5, 1.3, 1.3, 0.8], y: c.y, rotate: [0, -5, 5, -3, 0] }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.4, 0.7, 1] }}
        className="absolute" style={{ fontSize: 80 }}>🎁</motion.div>

      {/* Golden glow fills screen */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.5, 0] }}
        transition={{ duration: 3.2, times: [0, 0.4, 0.6, 1] }}
        className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--accent)/0.3), transparent 70%)" }} />

      {/* Coins fly EVERYWHERE */}
      {coins.map(coin => (
        <motion.div key={`coin-${coin.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + coin.x, y: c.y + coin.y, scale: [0, 0, 1.5, 1.2, 0], opacity: [0, 0, 1, 0.9, 0], rotate: coin.rot }}
          transition={{ duration: 3.2, delay: coin.d * 0.4, times: [0, 0.38, 0.55, 0.8, 1] }}
          className="absolute" style={{ fontSize: coin.s, color: "hsl(var(--accent))", textShadow: "0 0 8px hsl(var(--accent)/0.5)" }}>
          {["$", "✦", "✧", "◈", "€"][coin.id % 5]}
        </motion.div>
      ))}

      {/* Light rays filling entire viewport */}
      {rays.map(ray => (
        <motion.div key={`ray-${ray.id}`}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0, 0.6, 0], scaleY: [0, 0, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.45, 0.65, 1] }}
          className="absolute origin-center rounded-full"
          style={{
            left: c.x, top: c.y,
            width: 4, height: Math.max(W, H) * 0.7,
            background: "hsl(var(--accent)/0.2)",
            transform: `rotate(${(ray.angle * 180) / Math.PI}deg)`,
          }} />
      ))}
    </>
  );
};

/* ----- VITALITY: Seed → bloom → vines WRAP entire screen ---------- */
const EndVitality = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const leaves = scatter(40);
  const vines = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    startX: i < 6 ? 0 : W,
    startY: (i % 6) * (H / 6),
  }));

  return (
    <>
      {/* Seed */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0.6, 1.3, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 80 }}>🌱</motion.div>

      {/* Giant bloom glow */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 2, 4], opacity: [0, 0, 0.5, 0] }}
        transition={{ duration: 3.2, times: [0, 0.3, 0.55, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: W * 0.5, height: W * 0.5, background: "radial-gradient(circle, hsl(var(--primary)/0.4), transparent 70%)" }} />

      {/* Massive flower */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 2, 1.6, 0.8], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3.2, times: [0, 0.25, 0.45, 0.75, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ fontSize: 100 }}>🌸</motion.div>

      {/* Leaves/petals fly across entire screen */}
      {leaves.map(l => (
        <motion.div key={`leaf-${l.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + l.x, y: c.y + l.y, scale: [0, 0, 1.4, 0.8, 0], opacity: [0, 0, 1, 0.8, 0], rotate: l.rot }}
          transition={{ duration: 3.6, delay: l.d * 0.4, times: [0, 0.35, 0.55, 0.8, 1] }}
          className="absolute" style={{ fontSize: l.s, color: "hsl(var(--primary))" }}>
          {["❀", "✿", "❋", "☘", "✤", "🌿"][l.id % 6]}
        </motion.div>
      ))}

      {/* Vines crawling from edges across whole screen */}
      {vines.map(v => (
        <motion.div key={`vine-${v.id}`}
          initial={{ x: v.startX, y: v.startY, scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: [0, 0, 0.5, 0] }}
          transition={{ duration: 3.6, times: [0, 0.3, 0.6, 1] }}
          className="absolute h-[3px] rounded-full"
          style={{ width: W * 0.6, transformOrigin: v.startX < c.x ? "left" : "right", background: "hsl(var(--primary)/0.3)" }} />
      ))}
    </>
  );
};

/* ----- FORTITUDE: Shield forms → energy radiates across screen ---- */
const EndFortitude = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const fragments = ring(24, 30, 80);
  const radiateLines = Array.from({ length: 20 }, (_, i) => ({ id: i, angle: (i / 20) * Math.PI * 2 }));
  const burst = scatter(35);

  return (
    <>
      {/* Fragments converge */}
      {fragments.map(f => (
        <motion.div key={`frag-${f.id}`}
          initial={{ x: c.x + f.x * 5, y: c.y + f.y * 5, opacity: 0, scale: 0.3 }}
          animate={{ x: c.x + f.x * 0.3, y: c.y + f.y * 0.3, opacity: [0, 1, 1], scale: [0.3, 1.2, 0.8] }}
          transition={{ duration: 1.4, delay: f.d }}
          className="absolute" style={{ fontSize: f.s, color: "hsl(var(--foreground)/0.7)" }}>
          {["⬢", "◆", "◈"][f.id % 3]}
        </motion.div>
      ))}

      {/* Giant shield */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.6, 1.4], opacity: [0, 0, 1, 1] }}
        transition={{ duration: 2, times: [0, 0.5, 0.7, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ fontSize: 120, filter: "drop-shadow(0 0 30px hsl(var(--foreground)/0.3))" }}>🛡️</motion.div>

      {/* Energy lines radiating to screen edges */}
      {radiateLines.map(rl => (
        <motion.div key={`rad-${rl.id}`}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0, 0.7, 0], scaleY: [0, 0, 1, 0] }}
          transition={{ duration: 3.4, times: [0, 0.55, 0.75, 1] }}
          className="absolute origin-center rounded-full"
          style={{ left: c.x, top: c.y, width: 3, height: Math.max(W, H) * 0.6, background: "hsl(var(--foreground)/0.12)", transform: `rotate(${(rl.angle * 180) / Math.PI}deg)` }} />
      ))}

      {/* Full-screen burst */}
      {burst.map(bp => (
        <motion.div key={`fb-${bp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, scale: [0, 0, 1.4, 0], opacity: [0, 0, 1, 0] }}
          transition={{ duration: 3.4, times: [0, 0.6, 0.8, 1] }}
          className="absolute" style={{ fontSize: bp.s, color: "hsl(var(--foreground)/0.6)" }}>
          {["⬢", "◆", "✦"][bp.id % 3]}
        </motion.div>
      ))}

      {/* Shield glow pulse */}
      <motion.div initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 0.5, 3, 5], opacity: [0, 0, 0.4, 0] }}
        transition={{ duration: 3.4, times: [0, 0.55, 0.72, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: W * 0.4, height: W * 0.4, background: "hsl(var(--foreground)/0.1)" }} />
    </>
  );
};

/* ----- SURGE: Lightning charges → thunderbolt fills screen -------- */
const EndSurge = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const sparks = scatter(45);

  return (
    <>
      {/* Electric charges converge */}
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div key={`charge-${i}`}
          initial={{ x: Math.random() * W, y: Math.random() * H, opacity: 0, scale: 0 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
          transition={{ duration: 1.2, delay: i * 0.08 }}
          className="absolute" style={{ fontSize: 28, color: "hsl(var(--accent))", textShadow: "0 0 12px hsl(var(--accent)/0.7)" }}>⚡</motion.div>
      ))}

      {/* Multiple lightning bolts from top */}
      {[0.3, 0.5, 0.7].map((xPos, i) => (
        <motion.div key={`bolt-${i}`}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0, 1, 0.8, 0], scaleY: [0, 0, 1, 1, 0] }}
          transition={{ duration: 3, times: [0, 0.35, 0.4, 0.7, 1] }}
          className="absolute top-0" style={{ left: W * xPos, width: 4, height: H, transformOrigin: "top", background: `linear-gradient(180deg, hsl(var(--accent)/0.8), hsl(var(--accent)/0.2))`, boxShadow: "0 0 30px hsl(var(--accent)/0.5)" }} />
      ))}

      {/* MASSIVE central flash */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 6, 8], opacity: [0, 0, 0.8, 0] }}
        transition={{ duration: 3, times: [0, 0.38, 0.45, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: W * 0.3, height: W * 0.3, background: "hsl(var(--accent)/0.5)" }} />

      {/* Full-screen white flash */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.6, 0] }}
        transition={{ duration: 3, times: [0, 0.38, 0.42, 0.7] }}
        className="absolute inset-0 bg-accent/20" />

      {/* Sparks fly to every corner */}
      {sparks.map(sp => (
        <motion.div key={`spark-${sp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + sp.x, y: c.y + sp.y, scale: [0, 0, 1.5, 0], opacity: [0, 0, 1, 0], rotate: sp.rot }}
          transition={{ duration: 3, times: [0, 0.4, 0.65, 1] }}
          className="absolute" style={{ fontSize: sp.s, color: "hsl(var(--accent))", textShadow: "0 0 8px hsl(var(--accent)/0.5)" }}>
          {["✦", "╱", "╲", "✧", "◇"][sp.id % 5]}
        </motion.div>
      ))}
    </>
  );
};

/* ----- UNITY: Hearts converge → glowing network fills screen ------ */
const EndUnity = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const nodes = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const r = 120 + Math.random() * 80;
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: i * 0.06 };
  });
  const burst = scatter(30);

  return (
    <>
      {/* Hearts float in from everywhere */}
      {Array.from({ length: 16 }, (_, i) => (
        <motion.div key={`hf-${i}`}
          initial={{ x: Math.random() * W, y: Math.random() * H, opacity: 0 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 1.8, delay: i * 0.08 }}
          className="absolute" style={{ fontSize: 24 + Math.random() * 16, color: "hsl(var(--primary))" }}>💗</motion.div>
      ))}

      {/* Network nodes */}
      {nodes.map(n => (
        <motion.div key={`node-${n.id}`}
          initial={{ x: c.x + n.x, y: c.y + n.y, scale: 0, opacity: 0 }}
          animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 0.9, 0] }}
          transition={{ duration: 3.4, delay: n.d, times: [0, 0.35, 0.5, 0.8, 1] }}
          className="absolute w-5 h-5 rounded-full"
          style={{ background: "hsl(var(--primary)/0.6)", boxShadow: "0 0 16px hsl(var(--primary)/0.5)" }} />
      ))}

      {/* Connection lines */}
      {nodes.slice(0, 10).map((n, i) => {
        const next = nodes[(i + 4) % nodes.length];
        return (
          <motion.div key={`line-${n.id}`}
            initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.6, 0.4, 0] }}
            transition={{ duration: 3.4, times: [0, 0.4, 0.55, 0.8, 1] }}
            className="absolute"
            style={{
              left: c.x + n.x, top: c.y + n.y,
              width: Math.sqrt((next.x - n.x) ** 2 + (next.y - n.y) ** 2),
              height: 2, background: "hsl(var(--primary)/0.25)",
              transform: `rotate(${Math.atan2(next.y - n.y, next.x - n.x)}rad)`,
              transformOrigin: "0 0",
            }} />
        );
      })}

      {/* Full-screen burst */}
      {burst.map(bp => (
        <motion.div key={`ub-${bp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, scale: [0, 0, 1.3, 0], opacity: [0, 0, 1, 0] }}
          transition={{ duration: 3.4, times: [0, 0.65, 0.82, 1] }}
          className="absolute" style={{ fontSize: bp.s, color: "hsl(var(--primary))" }}>
          {["◌", "◎", "•", "✦", "◇"][bp.id % 5]}
        </motion.div>
      ))}

      {/* Big central heart */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.8, 1.5, 0], opacity: [0, 0, 1, 0.8, 0] }}
        transition={{ duration: 3.4, times: [0, 0.3, 0.5, 0.75, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ fontSize: 100 }}>💗</motion.div>
    </>
  );
};

/* ----- COSMOS: Stars → supernova → stardust fills the universe ---- */
const EndCosmos = () => {
  const c = vc();
  const W = vw();
  const H = vh();
  const starParts = scatter(50);
  const dust = spiral(24, 2, Math.min(W, H) * 0.4);

  return (
    <>
      {/* Stars drawn from all edges */}
      {Array.from({ length: 20 }, (_, i) => (
        <motion.div key={`si-${i}`}
          initial={{ x: Math.random() * W, y: Math.random() * H, opacity: 0, scale: 0.3 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 1, 0], scale: [0.3, 1.2, 0.5, 0] }}
          transition={{ duration: 1.6, delay: i * 0.06 }}
          className="absolute" style={{ fontSize: 16 + Math.random() * 16, color: "hsl(var(--primary))", textShadow: "0 0 8px hsl(var(--primary)/0.5)" }}>
          {["✧", "✹", "✦", "✶", "◇"][i % 5]}
        </motion.div>
      ))}

      {/* Core builds — MASSIVE orb */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 2, 0.3], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.8, times: [0, 0.35, 0.55, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: W * 0.2, height: W * 0.2, background: "radial-gradient(circle, hsl(var(--primary)), hsl(var(--accent)/0.5), transparent)", boxShadow: "0 0 80px hsl(var(--primary)/0.6), 0 0 160px hsl(var(--accent)/0.3)" }} />

      {/* Stardust spiral */}
      {dust.map(d => (
        <motion.div key={`dust-${d.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + d.x, y: c.y + d.y, opacity: [0, 0, 0.9, 0], scale: [0, 0, 1.2, 0] }}
          transition={{ duration: 3.4, delay: d.d * 0.3, times: [0, 0.3, 0.55, 1] }}
          className="absolute" style={{ fontSize: d.s, color: "hsl(var(--primary))", textShadow: "0 0 6px hsl(var(--primary)/0.4)" }}>✦</motion.div>
      ))}

      {/* SUPERNOVA — fills ENTIRE screen */}
      <motion.div initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 7, 10], opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: 3.4, times: [0, 0.5, 0.62, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ width: W * 0.3, height: W * 0.3, background: "hsl(var(--primary)/0.4)" }} />

      {/* Full-screen flash */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0.5, 0] }}
        transition={{ duration: 3.4, times: [0, 0.5, 0.58, 0.8] }}
        className="absolute inset-0 bg-primary/15" />

      {/* Stardust particles fly to every corner */}
      {starParts.map(sp => (
        <motion.div key={`nova-${sp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + sp.x, y: c.y + sp.y, scale: [0, 0, 1.5, 0.2], opacity: [0, 0, 1, 0], rotate: sp.rot }}
          transition={{ duration: 3.4, delay: sp.d * 0.3, times: [0, 0.52, 0.7, 1] }}
          className="absolute" style={{ fontSize: sp.s, color: "hsl(var(--primary))", textShadow: "0 0 8px hsl(var(--primary)/0.4)" }}>
          {["✧", "✹", "✦", "✶", "◇"][sp.id % 5]}
        </motion.div>
      ))}

      {/* Expanding rings */}
      {[0, 1, 2, 3].map(r => (
        <motion.div key={`cr-${r}`}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 0.2, 3 + r * 0.7], opacity: [0, 0, 0.5, 0] }}
          transition={{ duration: 3.4, delay: r * 0.06, times: [0, 0.52, 0.68, 1] }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
          style={{ width: W * 0.25, height: W * 0.25 }} />
      ))}
    </>
  );
};

/* ------------------------------------------------------------------ */
/*  EndLessonEffect - routes to specific path effect                   */
/* ------------------------------------------------------------------ */

export const EndLessonEffect = ({ pathId, active }: EndLessonEffectProps) => {
  if (!active || !pathId) return null;

  const path = NINE_PATHS.find(p => p.id === pathId);
  if (!path) return null;

  const effectMap: Record<string, React.ReactNode> = {
    chronos: <EndChronos />,
    syntax: <EndSyntax />,
    eloquence: <EndEloquence />,
    treasury: <EndTreasury />,
    vitality: <EndVitality />,
    fortitude: <EndFortitude />,
    surge: <EndSurge />,
    unity: <EndUnity />,
    cosmos: <EndCosmos />,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[92] pointer-events-none overflow-hidden"
      >
        {effectMap[pathId] || effectMap.cosmos}

        {/* Path name overlay — BIG and bold */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: [0, 0, 1, 1, 0], y: [30, 30, 0, 0, -15], scale: [0.8, 0.8, 1.1, 1.05, 1] }}
          transition={{ duration: 3.6, times: [0, 0.2, 0.35, 0.8, 1] }}
          className="absolute left-1/2 top-[18%] -translate-x-1/2 text-center z-10"
        >
          <div className="text-6xl mb-3" style={{ filter: "drop-shadow(0 0 20px hsl(var(--primary)/0.5))" }}>{path.emoji}</div>
          <h2 className="text-3xl font-bold text-foreground" style={{ textShadow: "0 2px 20px hsl(var(--background)/0.8)" }}>
            {path.name}
          </h2>
          <p className="text-base text-muted-foreground mt-2" style={{ textShadow: "0 1px 10px hsl(var(--background)/0.9)" }}>
            {path.endLessonDescription}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CorrectEffect;
