import { motion } from "framer-motion";
import { Trophy, BookOpen, Star, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";
import Confetti from "@/components/Confetti";
import type { Course } from "@/lib/courseData";

interface PathCompleteProps {
  course: Course;
  totalXp: number;
  onContinue: () => void;
}

const PathComplete = ({ course, totalXp, onContinue }: PathCompleteProps) => {
  const summaryPoints = course.lessons.map(l => l.title);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <Confetti active />

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <Mascot
          message={`Incredible! You completed the entire ${course.label} path! You're amazing! 🎉🏆`}
          size="md"
          animation="celebrate"
        />

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Path Complete!
          </h1>
          <p className="text-muted-foreground mb-6">
            {course.emoji} {course.label}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="lesson-card py-4 text-center">
            <BookOpen className="w-5 h-5 text-primary mx-auto mb-2" />
            <div className="text-lg font-semibold text-foreground">{course.lessons.length}</div>
            <div className="text-xs text-muted-foreground">Lessons</div>
          </div>
          <div className="lesson-card py-4 text-center">
            <Star className="w-5 h-5 text-accent mx-auto mb-2" />
            <div className="text-lg font-semibold text-foreground">{totalXp}</div>
            <div className="text-xs text-muted-foreground">XP Earned</div>
          </div>
        </motion.div>

        {/* Knowledge Summary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lesson-card text-left mb-6 border-primary/30"
        >
          <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> Knowledge Summary
          </h3>
          <ul className="space-y-2">
            {summaryPoints.map((point, i) => (
              <motion.li
                key={i}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.6 + i * 0.08 }}
                className="flex items-start gap-2 text-sm text-foreground"
              >
                <span className="text-primary mt-0.5">✓</span>
                <span>{point}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="lesson-card text-left mb-6 bg-secondary/50 border-0"
        >
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">💡 What's next?</span>{" "}
            You can always review these lessons from the Learn tab. This path has been auto-unenrolled to free up a slot for your next adventure!
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Button onClick={onContinue} className="w-full gap-2" size="lg">
            Continue <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PathComplete;
