import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface XpPopupProps {
  amount: number;
  show: boolean;
}

const XpPopup = ({ amount, show }: XpPopupProps) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        animate={{ opacity: 1, y: -20, scale: 1 }}
        exit={{ opacity: 0, y: -40, scale: 0.6 }}
        transition={{ duration: 0.6 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] flex items-center gap-2 bg-accent text-accent-foreground px-5 py-2.5 rounded-full shadow-lg font-semibold"
      >
        <Star className="w-5 h-5" />
        +{amount} XP
      </motion.div>
    )}
  </AnimatePresence>
);

export default XpPopup;
