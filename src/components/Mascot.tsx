import { forwardRef } from "react";
import { motion } from "framer-motion";
import mascotImg from "@/assets/mascot-penguin.png";

interface MascotProps {
  message: string;
  size?: "sm" | "md" | "lg";
  animation?: "wave" | "bounce" | "celebrate" | "idle";
  className?: string;
}

const sizeMap = {
  sm: "w-16 h-16",
  md: "w-24 h-24",
  lg: "w-32 h-32",
};

const animationMap = {
  wave: {
    animate: { rotate: [0, -10, 10, -10, 0] },
    transition: { duration: 1.5, repeat: Infinity, repeatDelay: 3 },
  },
  bounce: {
    animate: { y: [0, -8, 0] },
    transition: { duration: 0.6, repeat: Infinity, repeatDelay: 2 },
  },
  celebrate: {
    animate: { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] },
    transition: { duration: 0.8, repeat: Infinity, repeatDelay: 1.5 },
  },
  idle: {
    animate: { y: [0, -4, 0] },
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

// Using forwardRef to prevent React warning when used inside motion components
const Mascot = forwardRef<HTMLDivElement, MascotProps>(
  function Mascot({ message, size = "md", animation = "idle", className = "" }, ref) {
    const anim = animationMap[animation];

    return (
      <div ref={ref} className={`flex items-end gap-3 ${className}`}>
        <motion.div
          className={`${sizeMap[size]} shrink-0`}
          animate={anim.animate}
          transition={anim.transition}
        >
          <img
            src={mascotImg}
            alt="Pathways mascot penguin"
            className="w-full h-full object-contain drop-shadow-md"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: -5 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="relative bg-card border-2 border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-xs"
        >
          <p className="text-sm text-foreground font-medium leading-snug">{message}</p>
          <div className="absolute -left-2 bottom-2 w-3 h-3 bg-card border-l-2 border-b-2 border-border rotate-45" />
        </motion.div>
      </div>
    );
  }
);

export default Mascot;
