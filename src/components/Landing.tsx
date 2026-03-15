import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Mascot from "@/components/Mascot";

interface LandingProps {
  onGetStarted: () => void;
}

const Landing = ({ onGetStarted }: LandingProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg text-foreground tracking-tight">Pathways</span>
        </div>
        <Button variant="ghost" onClick={onGetStarted}>
          Sign in
        </Button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
          >
            <div className="inline-flex items-center gap-2 bg-accent/20 text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Life skills, mastered
            </div>
            <h1
              className="text-foreground font-semibold leading-[1.1] mb-6"
              style={{ fontSize: "clamp(2.25rem, 5vw, 3.75rem)" }}
            >
              Learn the skills
              <br />
              school never taught you.
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto mb-8 leading-relaxed">
              From tying shoelaces to doing taxes — master everyday life skills through
              interactive, bite-sized lessons for all ages.
            </p>
          </motion.div>

          {/* Mascot greeting */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex justify-center mb-8"
          >
            <Mascot
              message="Hey there! 👋 I'm Pebble, your learning buddy. Ready to level up?"
              size="lg"
              animation="wave"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.2, 0, 0, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Button size="lg" onClick={onGetStarted} className="gap-2 px-8 text-base">
              Get started — it's free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto"
          >
            {[
              { value: "32", label: "Skill paths" },
              { value: "200+", label: "Lessons" },
              { value: "5 min", label: "Per lesson" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-semibold text-foreground xp-counter">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
