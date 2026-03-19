import { motion, AnimatePresence } from "framer-motion";
import { NINE_PATHS } from "@/lib/paths";

interface CorrectEffectProps {
  pathId: string | null;
  active: boolean;
}

/**
 * Shows a brief themed visual effect when the user answers correctly.
 * Each path has a unique emoji and animation style.
 */
const CorrectEffect = ({ pathId, active }: CorrectEffectProps) => {
  if (!active || !pathId) return null;

  const path = NINE_PATHS.find(p => p.id === pathId);
  if (!path) return null;

  // Generate particles for the effect
  const particles = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: -100 - Math.random() * 200,
    delay: Math.random() * 0.2,
  }));

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 z-[80] pointer-events-none">
          {particles.map(p => (
            <motion.div
              key={p.id}
              initial={{ 
                x: window.innerWidth / 2 + p.x, 
                y: window.innerHeight / 2,
                opacity: 1, 
                scale: 0 
              }}
              animate={{ 
                y: window.innerHeight / 2 + p.y, 
                opacity: [0, 1, 1, 0], 
                scale: [0, 1.5, 1, 0] 
              }}
              transition={{ duration: 0.8, delay: p.delay }}
              className="absolute text-2xl"
            >
              {path.correctEmoji}
            </motion.div>
          ))}
          {/* Central flash */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 2, 3] }}
            transition={{ duration: 0.6 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl"
          >
            {path.correctEmoji}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CorrectEffect;

interface EndLessonEffectProps {
  pathId: string | null;
  active: boolean;
}

/**
 * Shows a dramatic end-of-lesson effect based on the user's path.
 */
export const EndLessonEffect = ({ pathId, active }: EndLessonEffectProps) => {
  if (!active || !pathId) return null;

  const path = NINE_PATHS.find(p => p.id === pathId);
  if (!path) return null;

  const burstParticles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    angle: (i / 20) * 360,
    distance: 100 + Math.random() * 150,
    delay: Math.random() * 0.3,
    size: 14 + Math.random() * 16,
  }));

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] pointer-events-none"
        >
          {/* Radial burst of themed emojis */}
          {burstParticles.map(p => {
            const rad = (p.angle * Math.PI) / 180;
            const targetX = Math.cos(rad) * p.distance;
            const targetY = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                initial={{
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  x: window.innerWidth / 2 + targetX,
                  y: window.innerHeight / 2 + targetY,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1.2, 0],
                }}
                transition={{ duration: 1.5, delay: p.delay, ease: "easeOut" }}
                className="absolute"
                style={{ fontSize: p.size }}
              >
                {path.correctEmoji}
              </motion.div>
            );
          })}

          {/* Central glow */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 5], opacity: [0, 0.4, 0] }}
            transition={{ duration: 2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-primary/30 blur-xl"
          />

          {/* Path name flash */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: [0, 1, 1, 0], scale: 1 }}
            transition={{ duration: 2, delay: 0.3 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 text-center"
          >
            <div className="text-5xl mb-2">{path.emoji}</div>
            <div className="text-lg font-bold text-foreground">{path.name}</div>
            <div className="text-sm text-muted-foreground">{path.endLessonDescription}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
