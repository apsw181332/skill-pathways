import { useState } from "react";
import Landing from "@/components/Landing";
import Onboarding, { type UserConfig } from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import LessonView from "@/components/LessonView";

type AppState = "landing" | "onboarding" | "dashboard" | "lesson";

const Index = () => {
  const [state, setState] = useState<AppState>("landing");
  const [config, setConfig] = useState<UserConfig>({
    interests: [],
    learningStyle: "",
    accessibility: [],
  });

  const handleOnboardingComplete = (userConfig: UserConfig) => {
    setConfig(userConfig);
    setState("dashboard");
  };

  switch (state) {
    case "landing":
      return <Landing onGetStarted={() => setState("onboarding")} />;
    case "onboarding":
      return <Onboarding onComplete={handleOnboardingComplete} />;
    case "dashboard":
      return <Dashboard config={config} onStartLesson={() => setState("lesson")} />;
    case "lesson":
      return <LessonView onBack={() => setState("dashboard")} />;
  }
};

export default Index;
