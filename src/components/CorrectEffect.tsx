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

type ThemeConfig = {
  correctGlyphs: string[];
  endGlyphs: string[];
  echoGlyphs: string[];
  particleClass: string;
  accentClass: string;
  glowClass: string;
  trailClass: string;
  label: string;
};

const THEMES: Record<string, ThemeConfig> = {
  syntax: {
    correctGlyphs: ["0", "1", "</>", "{}", "//"],
    endGlyphs: ["0", "1", "</>", "{}", "[]", "#"],
    echoGlyphs: ["</>", "0", "1", "//"],
    particleClass: "text-primary/85",
    accentClass: "text-accent",
    glowClass: "bg-primary/25",
    trailClass: "bg-primary/15",
    label: "code surge",
  },
  eloquence: {
    correctGlyphs: ["✍️", "A", "文", "✨", "✦"],
    endGlyphs: ["✍️", "A", "文", "語", "✦", "✨"],
    echoGlyphs: ["A", "✦", "語", "✨"],
    particleClass: "text-accent",
    accentClass: "text-primary",
    glowClass: "bg-accent/20",
    trailClass: "bg-accent/10",
    label: "word flare",
  },
  treasury: {
    correctGlyphs: ["🪙", "✦", "✧", "$", "◈"],
    endGlyphs: ["🪙", "✦", "✧", "◈", "✶", "$"],
    echoGlyphs: ["🪙", "✦", "$", "◈"],
    particleClass: "text-accent",
    accentClass: "text-primary",
    glowClass: "bg-accent/25",
    trailClass: "bg-accent/10",
    label: "gold burst",
  },
  vitality: {
    correctGlyphs: ["🍃", "✿", "❀", "✦", "🌿"],
    endGlyphs: ["🍃", "✿", "❀", "🌿", "✦", "❋"],
    echoGlyphs: ["🍃", "❀", "🌿", "✦"],
    particleClass: "text-primary",
    accentClass: "text-accent",
    glowClass: "bg-primary/20",
    trailClass: "bg-primary/10",
    label: "bloom pulse",
  },
  chronos: {
    correctGlyphs: ["⏱", "◆", "◴", "⌛", "◌"],
    endGlyphs: ["⏱", "◆", "◴", "⌛", "◌", "✦"],
    echoGlyphs: ["⏱", "◆", "⌛", "◌"],
    particleClass: "text-foreground",
    accentClass: "text-primary",
    glowClass: "bg-foreground/15",
    trailClass: "bg-foreground/10",
    label: "time fracture",
  },
  fortitude: {
    correctGlyphs: ["🛡️", "⬢", "✦", "◈", "◆"],
    endGlyphs: ["🛡️", "⬢", "✦", "◈", "◆", "✶"],
    echoGlyphs: ["🛡️", "⬢", "◆", "✦"],
    particleClass: "text-foreground",
    accentClass: "text-primary",
    glowClass: "bg-foreground/15",
    trailClass: "bg-foreground/10",
    label: "shield shock",
  },
  surge: {
    correctGlyphs: ["⚡", "✦", "╱", "╲", "✧"],
    endGlyphs: ["⚡", "✦", "╱", "╲", "✧", "✶"],
    echoGlyphs: ["⚡", "✦", "╱", "✧"],
    particleClass: "text-accent",
    accentClass: "text-primary",
    glowClass: "bg-accent/20",
    trailClass: "bg-accent/10",
    label: "storm split",
  },
  unity: {
    correctGlyphs: ["💗", "•", "◌", "✦", "◎"],
    endGlyphs: ["💗", "•", "◌", "✦", "◎", "✧"],
    echoGlyphs: ["💗", "•", "◎", "✦"],
    particleClass: "text-primary",
    accentClass: "text-accent",
    glowClass: "bg-primary/20",
    trailClass: "bg-primary/10",
    label: "bond bloom",
  },
  cosmos: {
    correctGlyphs: ["⭐", "✦", "✧", "✹", "☄︎"],
    endGlyphs: ["⭐", "✦", "✧", "✹", "☄︎", "✶"],
    echoGlyphs: ["⭐", "✦", "✹", "☄︎"],
    particleClass: "text-primary",
    accentClass: "text-accent",
    glowClass: "bg-primary/20",
    trailClass: "bg-primary/10",
    label: "nova bloom",
  },
};

const getViewportCenter = () => ({
  x: typeof window === "undefined" ? 0 : window.innerWidth / 2,
  y: typeof window === "undefined" ? 0 : window.innerHeight / 2,
});

const getTheme = (pathId: string | null) => {
  if (!pathId) return THEMES.syntax;
  return THEMES[pathId] ?? THEMES.syntax;
};

const createBurst = (count: number, minDistance: number, maxDistance: number) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const distance = minDistance + Math.random() * (maxDistance - minDistance);
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      delay: Math.random() * 0.2,
      size: 14 + Math.random() * 22,
      rotate: -140 + Math.random() * 280,
    };
  });

const createShards = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (i / count) * Math.PI * 2,
    distance: 140 + Math.random() * 140,
    delay: Math.random() * 0.35,
    height: 60 + Math.random() * 90,
    width: 4 + Math.random() * 5,
  }));

const createColumns = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    x: -240 + i * 40,
    y: -240 + Math.random() * 80,
    delay: Math.random() * 0.25,
    size: 14 + Math.random() * 12,
  }));

const CenterFlash = ({ glowClass }: { glowClass: string }) => (
  <>
    <motion.div
      initial={{ scale: 0.2, opacity: 0 }}
      animate={{ scale: [0.2, 1.4, 2.5], opacity: [0, 0.55, 0] }}
      transition={{ duration: 0.95, ease: "easeOut" }}
      className={`absolute top-1/2 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl ${glowClass}`}
    />
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: [0.3, 1.2, 1.7], opacity: [0, 0.8, 0] }}
      transition={{ duration: 0.9 }}
      className="absolute top-1/2 left-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40"
    />
  </>
);

const CorrectEffect = ({ pathId, active }: CorrectEffectProps) => {
  if (!active || !pathId) return null;

  const path = NINE_PATHS.find((item) => item.id === pathId);
  if (!path) return null;

  const center = getViewportCenter();
  const theme = getTheme(pathId);
  const particles = createBurst(18, 40, 150);
  const columns = pathId === "syntax" ? createColumns(8) : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[88] pointer-events-none overflow-hidden"
      >
        <CenterFlash glowClass={theme.glowClass} />

        {columns.map((column) => (
          <motion.div
            key={`column-${column.id}`}
            initial={{ x: center.x + column.x, y: center.y + 80, opacity: 0 }}
            animate={{ y: center.y - 140 + column.y, opacity: [0, 0.75, 0] }}
            transition={{ duration: 0.7, delay: column.delay, ease: "easeOut" }}
            className={`absolute font-mono ${theme.accentClass}`}
            style={{ fontSize: column.size }}
          >
            {theme.correctGlyphs[column.id % theme.correctGlyphs.length]}
          </motion.div>
        ))}

        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: center.x, y: center.y, opacity: 0, scale: 0.2, rotate: 0 }}
            animate={{
              x: center.x + particle.x,
              y: center.y + particle.y,
              opacity: [0, 1, 0],
              scale: [0.2, 1.15, 0.2],
              rotate: particle.rotate,
            }}
            transition={{ duration: 0.8, delay: particle.delay, ease: "easeOut" }}
            className={`absolute ${theme.particleClass}`}
            style={{ fontSize: particle.size }}
          >
            {theme.correctGlyphs[particle.id % theme.correctGlyphs.length]}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.15, 0.7] }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl ${theme.accentClass}`}
        >
          {path.correctEmoji}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const EchoEffect = ({ pathId, active }: EchoEffectProps) => {
  if (!active || !pathId) return null;

  const theme = getTheme(pathId);
  const center = getViewportCenter();
  const particles = createBurst(12, 30, 110);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[89] pointer-events-none overflow-hidden"
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: [0.4, 1.8], opacity: [0.5, 0] }}
          transition={{ duration: 1 }}
          className={`absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/35 ${theme.glowClass}`}
        />
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: center.x, y: center.y, scale: 0, opacity: 0 }}
            animate={{
              x: center.x + particle.x,
              y: center.y + particle.y,
              scale: [0, 1, 0.3],
              opacity: [0, 1, 0],
              rotate: particle.rotate,
            }}
            transition={{ duration: 0.95, delay: particle.delay, ease: "easeOut" }}
            className={`absolute ${theme.particleClass}`}
            style={{ fontSize: 16 + particle.id }}
          >
            {theme.echoGlyphs[particle.id % theme.echoGlyphs.length]}
          </motion.div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};

export const EndLessonEffect = ({ pathId, active }: EndLessonEffectProps) => {
  if (!active || !pathId) return null;

  const path = NINE_PATHS.find((item) => item.id === pathId);
  if (!path) return null;

  const center = getViewportCenter();
  const theme = getTheme(pathId);
  const particles = createBurst(34, 90, 260);
  const shards = createShards(16);
  const columns = pathId === "syntax" ? createColumns(14) : [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[92] pointer-events-none overflow-hidden"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.18, 0] }}
          transition={{ duration: 2.8 }}
          className={`absolute inset-0 ${theme.trailClass}`}
        />

        <motion.div
          initial={{ scale: 0.2, opacity: 0 }}
          animate={{ scale: [0.2, 2.2, 3.6], opacity: [0, 0.45, 0] }}
          transition={{ duration: 2.7, ease: "easeOut" }}
          className={`absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl ${theme.glowClass}`}
        />

        {[0, 1, 2].map((ring) => (
          <motion.div
            key={`ring-${ring}`}
            initial={{ scale: 0.25, opacity: 0 }}
            animate={{ scale: [0.25, 1.8 + ring * 0.35, 2.6 + ring * 0.45], opacity: [0, 0.45, 0] }}
            transition={{ duration: 2.4, delay: ring * 0.12, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30"
          />
        ))}

        {shards.map((shard) => {
          const x = Math.cos(shard.angle) * shard.distance;
          const y = Math.sin(shard.angle) * shard.distance;
          return (
            <motion.div
              key={`shard-${shard.id}`}
              initial={{ x: center.x, y: center.y, opacity: 0, scaleY: 0, rotate: (shard.angle * 180) / Math.PI }}
              animate={{
                x: center.x + x,
                y: center.y + y,
                opacity: [0, 0.9, 0],
                scaleY: [0, 1, 0.2],
              }}
              transition={{ duration: 1.7, delay: shard.delay, ease: "easeOut" }}
              className={`absolute origin-center rounded-full ${theme.glowClass}`}
              style={{ width: shard.width, height: shard.height }}
            />
          );
        })}

        {columns.map((column) => (
          <motion.div
            key={`end-column-${column.id}`}
            initial={{ x: center.x + column.x, y: center.y + 180, opacity: 0 }}
            animate={{ y: center.y - 220 + column.y, opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.8, delay: column.delay, ease: "easeOut" }}
            className={`absolute font-mono ${theme.accentClass}`}
            style={{ fontSize: column.size + 6 }}
          >
            {theme.endGlyphs[column.id % theme.endGlyphs.length]}
          </motion.div>
        ))}

        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: center.x, y: center.y, opacity: 0, scale: 0.2, rotate: 0 }}
            animate={{
              x: center.x + particle.x,
              y: center.y + particle.y,
              opacity: [0, 1, 1, 0],
              scale: [0.2, 1.25, 1, 0.15],
              rotate: particle.rotate,
            }}
            transition={{ duration: 2.15, delay: particle.delay, ease: "easeOut" }}
            className={`absolute ${theme.particleClass}`}
            style={{ fontSize: particle.size }}
          >
            {theme.endGlyphs[particle.id % theme.endGlyphs.length]}
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: [0, 1, 1, 0], y: [18, 0, 0, -10], scale: [0.9, 1, 1.05, 1] }}
          transition={{ duration: 2.6, delay: 0.18, ease: "easeOut" }}
          className="absolute left-1/2 top-[28%] -translate-x-1/2 text-center"
        >
          <div className={`mb-3 text-6xl ${theme.accentClass}`}>{path.emoji}</div>
          <div className="text-2xl font-semibold text-foreground">{path.name}</div>
          <div className="mt-1 text-sm uppercase tracking-[0.35em] text-muted-foreground">{theme.label}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CorrectEffect;
