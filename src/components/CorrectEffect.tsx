import { AnimatePresence, motion } from "framer-motion";
import { NINE_PATHS } from "@/lib/paths";

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

const vc = () => ({
  x: typeof window === "undefined" ? 400 : window.innerWidth / 2,
  y: typeof window === "undefined" ? 300 : window.innerHeight / 2,
});

const ring = (count: number, minR: number, maxR: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const r = minR + Math.random() * (maxR - minR);
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: Math.random() * 0.25, s: 14 + Math.random() * 20, rot: -180 + Math.random() * 360 };
  });

const spiral = (count: number, turns: number, maxR: number) =>
  Array.from({ length: count }, (_, i) => {
    const t = i / count;
    const a = t * turns * Math.PI * 2;
    const r = t * maxR;
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: t * 0.4, s: 12 + Math.random() * 16 };
  });

/* ------------------------------------------------------------------ */
/*  Correct-answer effects (short ~0.7s)                              */
/* ------------------------------------------------------------------ */

const CorrectEffect = ({ pathId, active }: CorrectEffectProps) => {
  if (!active || !pathId) return null;
  const path = NINE_PATHS.find(p => p.id === pathId);
  if (!path) return null;
  const c = vc();
  const burst = ring(14, 35, 130);

  const glyphs: Record<string, string[]> = {
    syntax:    ["0", "1", "</>", "{}", "=>", "//", "&&"],
    eloquence: ["✦", "A", "文", "語", "✧"],
    treasury:  ["🪙", "✦", "$", "◈", "✧"],
    vitality:  ["🍃", "✿", "❀", "🌿", "❋"],
    chronos:   ["⏱", "◆", "◴", "⌛", "◌"],
    fortitude: ["🛡️", "⬢", "◈", "◆", "✦"],
    surge:     ["⚡", "✦", "╱", "╲", "✧"],
    unity:     ["💗", "◌", "◎", "•", "✦"],
    cosmos:    ["⭐", "✧", "✹", "☄︎", "✦"],
  };
  const g = glyphs[pathId] || glyphs.syntax;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[88] pointer-events-none overflow-hidden">
        {/* Center glow */}
        <motion.div
          initial={{ scale: 0.15, opacity: 0 }}
          animate={{ scale: [0.15, 1.6, 2.8], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.65 }}
          className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl bg-primary/30"
        />
        {/* Center ring */}
        <motion.div
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 1.3, 1.8], opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.6 }}
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary/50"
        />
        {/* Center emoji */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 1.3, 0.8], opacity: [0, 1, 0] }}
          transition={{ duration: 0.6 }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl"
        >
          {path.correctEmoji}
        </motion.div>

        {/* Syntax: code streaks rise upward */}
        {pathId === "syntax" && Array.from({ length: 10 }, (_, i) => (
          <motion.div
            key={`code-${i}`}
            initial={{ x: c.x - 180 + i * 40, y: c.y + 60, opacity: 0 }}
            animate={{ y: c.y - 200, opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.55, delay: i * 0.03 }}
            className="absolute font-mono text-primary/70"
            style={{ fontSize: 13 + Math.random() * 8 }}
          >
            {g[i % g.length]}
          </motion.div>
        ))}

        {/* All paths: burst particles */}
        {burst.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: c.x, y: c.y, scale: 0, opacity: 0, rotate: 0 }}
            animate={{ x: c.x + p.x, y: c.y + p.y, scale: [0, 1.1, 0], opacity: [0, 1, 0], rotate: p.rot }}
            transition={{ duration: 0.65, delay: p.d, ease: "easeOut" }}
            className="absolute"
            style={{ fontSize: p.s }}
          >
            {g[p.id % g.length]}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

/* ------------------------------------------------------------------ */
/*  Echo-of-Path effect                                               */
/* ------------------------------------------------------------------ */

export const EchoEffect = ({ pathId, active }: EchoEffectProps) => {
  if (!active || !pathId) return null;
  const c = vc();
  const particles = ring(10, 25, 100);
  const glyphs: Record<string, string[]> = {
    chronos: ["⏱", "◆", "⌛", "◌"], syntax: ["</>", "0", "1", "//"], default: ["✦", "✧", "✹", "◈"],
  };
  const g = glyphs[pathId] || glyphs.default;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[89] pointer-events-none overflow-hidden">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: [0.3, 2], opacity: [0.6, 0] }}
          transition={{ duration: 0.9 }}
          className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40 bg-primary/10"
        />
        {particles.map(p => (
          <motion.div
            key={p.id}
            initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
            animate={{ x: c.x + p.x, y: c.y + p.y, scale: [0, 1, 0.3], opacity: [0, 1, 0], rotate: p.rot }}
            transition={{ duration: 0.85, delay: p.d }}
            className="absolute text-primary"
            style={{ fontSize: 14 + p.id }}
          >
            {g[p.id % g.length]}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

/* ------------------------------------------------------------------ */
/*  End-lesson effects (3-4s, spectacular, unique per path)           */
/* ------------------------------------------------------------------ */

/* ----- CHRONOS: Golden clock → time spiral → explosion ----------- */
const EndChronos = () => {
  const c = vc();
  const timeParticles = ring(28, 80, 280);
  const spiralParts = spiral(20, 2, 160);
  const clockMarks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    return { id: i, x: Math.cos(a) * 70, y: Math.sin(a) * 70 };
  });

  return (
    <>
      {/* Phase 1: Dark flash */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.15, 0] }} transition={{ duration: 1.2 }} className="absolute inset-0 bg-foreground/10" />

      {/* Phase 2: Golden clock face appears */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.1, 1], opacity: [0, 1, 1, 0.9] }}
        transition={{ duration: 1.2, times: [0, 0.4, 0.6, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {/* Clock outer ring */}
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, ease: "linear" }}
          className="w-40 h-40 rounded-full border-4 border-accent/70 relative"
          style={{ boxShadow: "0 0 60px hsl(var(--accent)/0.4), 0 0 120px hsl(var(--accent)/0.2), inset 0 0 30px hsl(var(--accent)/0.1)" }}
        >
          {/* Clock marks */}
          {clockMarks.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1] }}
              transition={{ delay: 0.3 + m.id * 0.04 }}
              className="absolute w-2 h-2 rounded-full bg-accent/80"
              style={{ left: 70 + m.x, top: 70 + m.y }}
            />
          ))}
          {/* Clock hand — spins fast then stops */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 360, 720, 1080] }}
            transition={{ duration: 1.6, ease: [0.2, 0.8, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 origin-bottom -translate-x-1/2"
            style={{ width: 3, height: 50, bottom: "50%", background: "hsl(var(--accent))", borderRadius: 4 }}
          />
          {/* Short hand */}
          <motion.div
            initial={{ rotate: 90 }}
            animate={{ rotate: [90, 270, 450] }}
            transition={{ duration: 1.6, ease: [0.2, 0.8, 0.3, 1] }}
            className="absolute left-1/2 top-1/2 origin-bottom -translate-x-1/2"
            style={{ width: 3, height: 32, bottom: "50%", background: "hsl(var(--accent)/0.7)", borderRadius: 4 }}
          />
        </motion.div>
        {/* Center dot */}
        <motion.div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-accent" style={{ boxShadow: "0 0 12px hsl(var(--accent)/0.8)" }} />
      </motion.div>

      {/* Phase 3: Time spiral swirls around clock */}
      {spiralParts.map(sp => (
        <motion.div
          key={`sp-${sp.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + sp.x, y: c.y + sp.y, opacity: [0, 0.9, 0.7, 0], scale: [0, 1, 0.8, 0] }}
          transition={{ duration: 2.2, delay: 0.6 + sp.d }}
          className="absolute text-accent/80"
          style={{ fontSize: sp.s }}
        >
          {["⏱", "◆", "◴", "⌛", "◌", "⏳"][sp.id % 6]}
        </motion.div>
      ))}

      {/* Phase 4: Clock explodes into time particles */}
      {timeParticles.map(tp => (
        <motion.div
          key={`tp-${tp.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + tp.x, y: c.y + tp.y, opacity: [0, 0, 1, 0], scale: [0, 0, 1.3, 0.1], rotate: tp.rot }}
          transition={{ duration: 3.2, delay: 1.5 + tp.d * 0.6, times: [0, 0.45, 0.65, 1] }}
          className="absolute"
          style={{ fontSize: tp.s }}
        >
          {["⏱", "◆", "◴", "⌛", "◌", "✦"][tp.id % 6]}
        </motion.div>
      ))}

      {/* Explosion flash */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 3, 5], opacity: [0, 0, 0.6, 0] }}
        transition={{ duration: 3.2, times: [0, 0.47, 0.55, 1] }}
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-accent/40"
      />

      {/* Expanding rings on explosion */}
      {[0, 1, 2].map(r => (
        <motion.div
          key={`ring-${r}`}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 0.2, 2.5 + r * 0.4], opacity: [0, 0, 0.5, 0] }}
          transition={{ duration: 3.2, delay: r * 0.08, times: [0, 0.47, 0.6, 1] }}
          className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent/40"
        />
      ))}
    </>
  );
};

/* ----- SYNTAX: Matrix code rain → hologram wall → flash ---------- */
const EndSyntax = () => {
  const c = vc();
  const codeChars = ["0", "1", "</>", "{}", "[]", "=>", "&&", "||", "++", "fn", "#", "//"];
  const rainColumns = Array.from({ length: 16 }, (_, i) => ({
    id: i, x: -320 + i * 42, delay: Math.random() * 0.4,
  }));
  const burstParts = ring(30, 60, 240);
  const wallCells = Array.from({ length: 24 }, (_, i) => ({
    id: i, x: -160 + (i % 6) * 65, y: -100 + Math.floor(i / 6) * 55, delay: 1.0 + Math.random() * 0.4,
  }));

  return (
    <>
      {/* Phase 1: Code rain falling */}
      {rainColumns.map(col => (
        <motion.div
          key={`rain-${col.id}`}
          initial={{ x: c.x + col.x, y: -30, opacity: 0 }}
          animate={{ y: [c.y * 2 + 50], opacity: [0, 0.8, 0.6, 0] }}
          transition={{ duration: 1.8, delay: col.delay, ease: "linear" }}
          className="absolute font-mono text-primary/70"
          style={{ fontSize: 14 }}
        >
          {Array.from({ length: 8 }, (_, j) => (
            <div key={j} className="mb-1">{codeChars[(col.id + j) % codeChars.length]}</div>
          ))}
        </motion.div>
      ))}

      {/* Phase 2: Hologram wall assembles at center */}
      {wallCells.map(cell => (
        <motion.div
          key={`wall-${cell.id}`}
          initial={{ x: c.x + cell.x + (Math.random() - 0.5) * 200, y: c.y + cell.y + (Math.random() - 0.5) * 200, opacity: 0, scale: 0 }}
          animate={{ x: c.x + cell.x, y: c.y + cell.y, opacity: [0, 0, 0.9, 0.9, 0], scale: [0, 0, 1, 1, 0.5] }}
          transition={{ duration: 3.4, delay: cell.delay * 0.5, times: [0, 0.28, 0.42, 0.75, 1] }}
          className="absolute font-mono text-primary/80 bg-primary/5 rounded px-1"
          style={{ fontSize: 13, border: "1px solid hsl(var(--primary)/0.2)" }}
        >
          {codeChars[cell.id % codeChars.length]}
        </motion.div>
      ))}

      {/* Phase 3: Bright flash + particle burst */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 4], opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: 3.4, times: [0, 0.7, 0.82, 1] }}
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-primary/40"
      />
      {burstParts.map(bp => (
        <motion.div
          key={`sburst-${bp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, scale: [0, 0, 1.2, 0], opacity: [0, 0, 1, 0], rotate: bp.rot }}
          transition={{ duration: 3.4, times: [0, 0.72, 0.85, 1] }}
          className="absolute font-mono text-primary/80"
          style={{ fontSize: bp.s }}
        >
          {codeChars[bp.id % codeChars.length]}
        </motion.div>
      ))}
    </>
  );
};

/* ----- ELOQUENCE: Floating words → shining arc ------------------- */
const EndEloquence = () => {
  const c = vc();
  const words = ["Words", "語", "Parole", "Слова", "كلمات", "言葉", "Mot", "Wort", "✦", "✧", "A", "文"];
  const arcParts = spiral(18, 0.5, 200);
  const burst = ring(24, 70, 240);

  return (
    <>
      {/* Phase 1: Words float up from bottom */}
      {words.map((w, i) => (
        <motion.div
          key={`word-${i}`}
          initial={{ x: c.x - 200 + i * 35, y: c.y + 300, opacity: 0 }}
          animate={{ y: c.y - 100 - Math.random() * 150, opacity: [0, 0.9, 0.7, 0], rotate: [-5 + Math.random() * 10] }}
          transition={{ duration: 2.2, delay: i * 0.12 }}
          className="absolute text-accent/80 font-semibold"
          style={{ fontSize: 16 + Math.random() * 12 }}
        >
          {w}
        </motion.div>
      ))}

      {/* Phase 2: Arc forms */}
      {arcParts.map(ap => (
        <motion.div
          key={`arc-${ap.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + ap.x, y: c.y + ap.y - 60, opacity: [0, 0, 1, 0.8, 0], scale: [0, 0, 1.2, 1, 0] }}
          transition={{ duration: 3.2, delay: ap.d, times: [0, 0.3, 0.5, 0.8, 1] }}
          className="absolute text-accent/90"
          style={{ fontSize: ap.s }}
        >
          {words[ap.id % words.length]}
        </motion.div>
      ))}

      {/* Phase 3: Burst */}
      {burst.map(bp => (
        <motion.div
          key={`eb-${bp.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, opacity: [0, 0, 1, 0], scale: [0, 0, 1.1, 0], rotate: bp.rot }}
          transition={{ duration: 3.2, times: [0, 0.6, 0.78, 1] }}
          className="absolute text-accent/70"
          style={{ fontSize: bp.s }}
        >
          ✦
        </motion.div>
      ))}

      {/* Glow arc */}
      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: [0, 0, 1.2, 1, 0], opacity: [0, 0, 0.6, 0.5, 0] }}
        transition={{ duration: 3.2, times: [0, 0.3, 0.55, 0.8, 1] }}
        className="absolute left-1/2 top-[35%] -translate-x-1/2 w-80 h-3 rounded-full bg-accent/30 blur-md"
      />
    </>
  );
};

/* ----- TREASURY: Chest opens → gold coins spiral → light rays ---- */
const EndTreasury = () => {
  const c = vc();
  const coins = ring(26, 60, 250);
  const rays = Array.from({ length: 12 }, (_, i) => ({
    id: i, angle: (i / 12) * Math.PI * 2,
  }));

  return (
    <>
      {/* Phase 1: Treasure chest appears and shakes */}
      <motion.div
        initial={{ scale: 0, y: c.y, x: c.x - 40 }}
        animate={{ scale: [0, 1.2, 1, 1, 0.8], y: c.y, rotate: [0, -5, 5, -3, 0] }}
        transition={{ duration: 1.8, times: [0, 0.2, 0.4, 0.7, 1] }}
        className="absolute text-7xl"
      >
        🎁
      </motion.div>

      {/* Phase 2: Chest opens — golden glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 2.5, 4], opacity: [0, 0, 0.5, 0] }}
        transition={{ duration: 3.2, times: [0, 0.4, 0.6, 1] }}
        className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-accent/50"
      />

      {/* Phase 3: Coins spiral outward */}
      {coins.map(coin => (
        <motion.div
          key={`coin-${coin.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + coin.x, y: c.y + coin.y, scale: [0, 0, 1.3, 1, 0], opacity: [0, 0, 1, 0.9, 0], rotate: coin.rot }}
          transition={{ duration: 3.2, delay: coin.d * 0.5, times: [0, 0.38, 0.55, 0.8, 1] }}
          className="absolute"
          style={{ fontSize: coin.s }}
        >
          {["🪙", "✦", "✧", "$", "◈"][coin.id % 5]}
        </motion.div>
      ))}

      {/* Light rays */}
      {rays.map(ray => (
        <motion.div
          key={`ray-${ray.id}`}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0, 0.6, 0], scaleY: [0, 0, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.45, 0.65, 1] }}
          className="absolute origin-center bg-accent/20 rounded-full"
          style={{
            left: c.x, top: c.y,
            width: 3, height: 140,
            transform: `rotate(${(ray.angle * 180) / Math.PI}deg)`,
          }}
        />
      ))}
    </>
  );
};

/* ----- VITALITY: Seed → bloom → vines wrap screen ---------------- */
const EndVitality = () => {
  const c = vc();
  const leaves = ring(22, 50, 220);
  const vines = Array.from({ length: 8 }, (_, i) => ({
    id: i, startX: (i < 4 ? 0 : typeof window !== "undefined" ? window.innerWidth : 800),
    startY: (i % 4) * ((typeof window !== "undefined" ? window.innerHeight : 600) / 4),
  }));

  return (
    <>
      {/* Phase 1: Seed appears and grows */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0.5, 1.2, 1], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
      >
        🌱
      </motion.div>

      {/* Phase 2: Bloom */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.8, 2.5], opacity: [0, 0, 0.6, 0] }}
        transition={{ duration: 3, times: [0, 0.3, 0.55, 1] }}
        className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl bg-primary/30"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.4), transparent 70%)" }}
      />

      {/* Phase 2b: Flower appears */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.5, 1.2, 0.8], opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3, times: [0, 0.25, 0.45, 0.75, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl"
      >
        🌸
      </motion.div>

      {/* Phase 3: Leaves/petals burst outward */}
      {leaves.map(l => (
        <motion.div
          key={`leaf-${l.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + l.x, y: c.y + l.y, scale: [0, 0, 1.2, 0.8, 0], opacity: [0, 0, 1, 0.8, 0], rotate: l.rot }}
          transition={{ duration: 3.4, delay: l.d * 0.4, times: [0, 0.35, 0.55, 0.8, 1] }}
          className="absolute"
          style={{ fontSize: l.s }}
        >
          {["🍃", "✿", "❀", "🌿", "❋", "🌼"][l.id % 6]}
        </motion.div>
      ))}

      {/* Vines crawling from edges */}
      {vines.map(v => (
        <motion.div
          key={`vine-${v.id}`}
          initial={{ x: v.startX, y: v.startY, scaleX: 0, opacity: 0 }}
          animate={{ x: c.x + (Math.random() - 0.5) * 100, y: c.y + (Math.random() - 0.5) * 100, scaleX: 1, opacity: [0, 0, 0.4, 0] }}
          transition={{ duration: 3.4, times: [0, 0.3, 0.6, 1] }}
          className="absolute w-40 h-1 rounded-full bg-primary/30"
          style={{ transformOrigin: v.startX < c.x ? "left" : "right" }}
        />
      ))}
    </>
  );
};

/* ----- FORTITUDE: Shield materializes → energy radiates ---------- */
const EndFortitude = () => {
  const c = vc();
  const shieldFragments = ring(18, 20, 60);
  const radiateLines = Array.from({ length: 16 }, (_, i) => ({
    id: i, angle: (i / 16) * Math.PI * 2,
  }));
  const burst = ring(24, 80, 240);

  return (
    <>
      {/* Phase 1: Fragments converge to form shield */}
      {shieldFragments.map(f => (
        <motion.div
          key={`frag-${f.id}`}
          initial={{ x: c.x + f.x * 4, y: c.y + f.y * 4, opacity: 0, scale: 0.3 }}
          animate={{ x: c.x + f.x * 0.3, y: c.y + f.y * 0.3, opacity: [0, 1, 1], scale: [0.3, 1, 0.8] }}
          transition={{ duration: 1.4, delay: f.d }}
          className="absolute"
          style={{ fontSize: f.s, color: "hsl(var(--foreground)/0.7)" }}
        >
          {["⬢", "◆", "◈"][f.id % 3]}
        </motion.div>
      ))}

      {/* Phase 2: Shield appears */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.4, 1.2], opacity: [0, 0, 1, 1] }}
        transition={{ duration: 2, times: [0, 0.5, 0.7, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl"
        style={{ filter: "drop-shadow(0 0 20px hsl(var(--foreground)/0.3))" }}
      >
        🛡️
      </motion.div>

      {/* Phase 3: Radiate energy lines */}
      {radiateLines.map(rl => (
        <motion.div
          key={`rad-${rl.id}`}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: [0, 0, 0.7, 0], scaleY: [0, 0, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.55, 0.75, 1] }}
          className="absolute origin-center rounded-full bg-foreground/15"
          style={{ left: c.x, top: c.y, width: 2, height: 160, transform: `rotate(${(rl.angle * 180) / Math.PI}deg)` }}
        />
      ))}

      {/* Phase 4: Burst + fade */}
      {burst.map(bp => (
        <motion.div
          key={`fb-${bp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, scale: [0, 0, 1.2, 0], opacity: [0, 0, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.6, 0.8, 1] }}
          className="absolute text-foreground/60"
          style={{ fontSize: bp.s }}
        >
          {["🛡️", "⬢", "◆", "✦"][bp.id % 4]}
        </motion.div>
      ))}

      {/* Shield glow pulse */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: [0.5, 0.5, 2, 3.5], opacity: [0, 0, 0.4, 0] }}
        transition={{ duration: 3.2, times: [0, 0.55, 0.72, 1] }}
        className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-foreground/15"
      />
    </>
  );
};

/* ----- SURGE: Lightning charges → thunderbolt strikes ------------ */
const EndSurge = () => {
  const c = vc();
  const sparks = ring(30, 50, 260);
  const zigzag = Array.from({ length: 6 }, (_, i) => ({
    id: i, x: -80 + i * 32, y: -200 + i * 70,
  }));

  return (
    <>
      {/* Phase 1: Electric charge builds — small sparks */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`charge-${i}`}
          initial={{ x: c.x + (Math.random() - 0.5) * 200, y: c.y + (Math.random() - 0.5) * 200, opacity: 0, scale: 0 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 0], scale: [0, 1, 0] }}
          transition={{ duration: 1.2, delay: i * 0.1 }}
          className="absolute text-accent text-xl"
        >
          ⚡
        </motion.div>
      ))}

      {/* Phase 2: Lightning bolt strikes down */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 0, 1, 0.8, 0], scaleY: [0, 0, 1, 1, 0] }}
        transition={{ duration: 3, times: [0, 0.35, 0.4, 0.7, 1] }}
        className="absolute left-1/2 -translate-x-1/2 top-0"
        style={{ width: 6, transformOrigin: "top" }}
      >
        {zigzag.map(z => (
          <motion.div
            key={`zig-${z.id}`}
            className="bg-accent rounded"
            style={{ width: 6, height: 70, marginLeft: z.x, boxShadow: "0 0 20px hsl(var(--accent)/0.6)" }}
          />
        ))}
      </motion.div>

      {/* Central flash */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 5, 6], opacity: [0, 0, 0.8, 0] }}
        transition={{ duration: 3, times: [0, 0.38, 0.45, 1] }}
        className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-accent/50"
      />

      {/* Screen flash */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.5, 0] }}
        transition={{ duration: 3, times: [0, 0.38, 0.42, 0.7] }}
        className="absolute inset-0 bg-accent/15"
      />

      {/* Phase 3: Electric sparks fly out */}
      {sparks.map(sp => (
        <motion.div
          key={`spark-${sp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + sp.x, y: c.y + sp.y, scale: [0, 0, 1.3, 0], opacity: [0, 0, 1, 0], rotate: sp.rot }}
          transition={{ duration: 3, times: [0, 0.4, 0.65, 1] }}
          className="absolute text-accent/80"
          style={{ fontSize: sp.s }}
        >
          {["⚡", "✦", "╱", "╲", "✧"][sp.id % 5]}
        </motion.div>
      ))}
    </>
  );
};

/* ----- UNITY: Hearts converge → network of bonds forms ----------- */
const EndUnity = () => {
  const c = vc();
  const nodes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const r = 100 + Math.random() * 60;
    return { id: i, x: Math.cos(a) * r, y: Math.sin(a) * r, d: i * 0.08 };
  });
  const burst = ring(20, 80, 220);

  return (
    <>
      {/* Phase 1: Hearts float inward */}
      {Array.from({ length: 10 }, (_, i) => (
        <motion.div
          key={`hf-${i}`}
          initial={{ x: c.x + (Math.random() - 0.5) * 500, y: c.y + (Math.random() - 0.5) * 500, opacity: 0 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 0.8, 0] }}
          transition={{ duration: 1.8, delay: i * 0.1 }}
          className="absolute text-2xl"
        >
          💗
        </motion.div>
      ))}

      {/* Phase 2: Network nodes appear */}
      {nodes.map(n => (
        <motion.div
          key={`node-${n.id}`}
          initial={{ x: c.x + n.x, y: c.y + n.y, scale: 0, opacity: 0 }}
          animate={{ scale: [0, 0, 1, 1, 0], opacity: [0, 0, 1, 0.9, 0] }}
          transition={{ duration: 3.2, delay: n.d, times: [0, 0.35, 0.5, 0.8, 1] }}
          className="absolute w-4 h-4 rounded-full bg-primary/60"
          style={{ boxShadow: "0 0 12px hsl(var(--primary)/0.4)" }}
        />
      ))}

      {/* Connection lines between nodes */}
      {nodes.slice(0, 8).map((n, i) => {
        const next = nodes[(i + 3) % nodes.length];
        return (
          <motion.div
            key={`line-${n.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0, 0.5, 0.4, 0] }}
            transition={{ duration: 3.2, times: [0, 0.4, 0.55, 0.8, 1] }}
            className="absolute bg-primary/20"
            style={{
              left: c.x + n.x, top: c.y + n.y,
              width: Math.sqrt((next.x - n.x) ** 2 + (next.y - n.y) ** 2),
              height: 2,
              transform: `rotate(${Math.atan2(next.y - n.y, next.x - n.x)}rad)`,
              transformOrigin: "0 0",
            }}
          />
        );
      })}

      {/* Phase 3: Burst outward */}
      {burst.map(bp => (
        <motion.div
          key={`ub-${bp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + bp.x, y: c.y + bp.y, scale: [0, 0, 1, 0], opacity: [0, 0, 1, 0] }}
          transition={{ duration: 3.2, times: [0, 0.65, 0.82, 1] }}
          className="absolute"
          style={{ fontSize: bp.s }}
        >
          {["💗", "◌", "◎", "•", "✦"][bp.id % 5]}
        </motion.div>
      ))}

      {/* Central heart glow */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 1.5, 1.3, 0], opacity: [0, 0, 1, 0.8, 0] }}
        transition={{ duration: 3.2, times: [0, 0.3, 0.5, 0.75, 1] }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl"
      >
        💗
      </motion.div>
    </>
  );
};

/* ----- COSMOS: Stars gather → supernova → stardust --------------- */
const EndCosmos = () => {
  const c = vc();
  const starParts = ring(32, 80, 300);
  const dust = spiral(20, 1.5, 180);

  return (
    <>
      {/* Phase 1: Stars drawn inward */}
      {Array.from({ length: 14 }, (_, i) => (
        <motion.div
          key={`star-in-${i}`}
          initial={{ x: c.x + (Math.random() - 0.5) * 600, y: c.y + (Math.random() - 0.5) * 600, opacity: 0, scale: 0.3 }}
          animate={{ x: c.x, y: c.y, opacity: [0, 1, 1, 0], scale: [0.3, 1, 0.5, 0] }}
          transition={{ duration: 1.6, delay: i * 0.08 }}
          className="absolute"
          style={{ fontSize: 14 + Math.random() * 14 }}
        >
          {["⭐", "✧", "✹", "☄︎", "✦"][i % 5]}
        </motion.div>
      ))}

      {/* Phase 2: Core builds — bright orb */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1.5, 0.3], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.6, times: [0, 0.35, 0.55, 1] }}
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--primary)), hsl(var(--accent)/0.5), transparent)", boxShadow: "0 0 60px hsl(var(--primary)/0.6), 0 0 120px hsl(var(--accent)/0.3)" }}
      />

      {/* Phase 2b: Stardust spiral */}
      {dust.map(d => (
        <motion.div
          key={`dust-${d.id}`}
          initial={{ x: c.x, y: c.y, opacity: 0, scale: 0 }}
          animate={{ x: c.x + d.x, y: c.y + d.y, opacity: [0, 0, 0.8, 0], scale: [0, 0, 1, 0] }}
          transition={{ duration: 3.2, delay: d.d * 0.3, times: [0, 0.3, 0.55, 1] }}
          className="absolute text-primary/80"
          style={{ fontSize: d.s }}
        >
          ✦
        </motion.div>
      ))}

      {/* Phase 3: Supernova explosion */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 0, 5, 7], opacity: [0, 0, 0.7, 0] }}
        transition={{ duration: 3.2, times: [0, 0.5, 0.62, 1] }}
        className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl bg-primary/40"
      />

      {/* Stardust particles fly outward */}
      {starParts.map(sp => (
        <motion.div
          key={`nova-${sp.id}`}
          initial={{ x: c.x, y: c.y, scale: 0, opacity: 0 }}
          animate={{ x: c.x + sp.x, y: c.y + sp.y, scale: [0, 0, 1.3, 0.2], opacity: [0, 0, 1, 0], rotate: sp.rot }}
          transition={{ duration: 3.2, delay: sp.d * 0.3, times: [0, 0.52, 0.7, 1] }}
          className="absolute"
          style={{ fontSize: sp.s }}
        >
          {["⭐", "✧", "✹", "☄︎", "✦", "✶"][sp.id % 6]}
        </motion.div>
      ))}

      {/* Expanding rings */}
      {[0, 1, 2].map(r => (
        <motion.div
          key={`cr-${r}`}
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 0.2, 2.5 + r * 0.5], opacity: [0, 0, 0.5, 0] }}
          transition={{ duration: 3.2, delay: r * 0.06, times: [0, 0.52, 0.68, 1] }}
          className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
        />
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

        {/* Path name overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: [0, 0, 1, 1, 0], y: [20, 20, 0, 0, -10], scale: [0.9, 0.9, 1, 1.02, 1] }}
          transition={{ duration: 3.4, times: [0, 0.2, 0.35, 0.8, 1] }}
          className="absolute left-1/2 top-[20%] -translate-x-1/2 text-center z-10"
        >
          <div className="text-6xl mb-3">{path.emoji}</div>
          <div className="text-2xl font-bold text-foreground">{path.name}</div>
          <div className="mt-1 text-sm uppercase tracking-[0.3em] text-muted-foreground">Lesson Complete</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CorrectEffect;
