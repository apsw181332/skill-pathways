import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  active: boolean;
}

const COLORS = [
  "hsl(230, 58%, 48%)", // primary
  "hsl(42, 70%, 62%)",  // accent
  "hsl(150, 60%, 50%)", // green
  "hsl(340, 70%, 55%)", // pink
  "hsl(280, 60%, 55%)", // purple
  "hsl(200, 70%, 55%)", // cyan
];

const Confetti = ({ active }: ConfettiProps) => {
  const [particles, setParticles] = useState<Array<{
    id: number; x: number; color: string; delay: number; size: number; rotation: number;
  }>>([]);

  useEffect(() => {
    if (active) {
      const newParticles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      }));
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {active && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", opacity: 0, rotate: p.rotation + 720 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.5 + Math.random(), delay: p.delay, ease: "easeIn" }}
              style={{
                position: "absolute",
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};

export default Confetti;
