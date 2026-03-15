import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Landing from "@/components/Landing";
import AuthPage from "@/components/AuthPage";
import Onboarding, { type UserConfig } from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import LessonView from "@/components/LessonView";

type AppState = "landing" | "auth" | "onboarding" | "dashboard" | "lesson";

const Index = () => {
  const { user, isReady, signUp, signIn, signOut, resetPassword } = useAuth();
  const [state, setState] = useState<AppState>("landing");
  const [config, setConfig] = useState<UserConfig>({
    interests: [],
    learningStyle: "",
    accessibility: [],
  });

  // Once auth is ready and user is logged in, go to dashboard
  // (unless they're in onboarding or lesson)
  const effectiveState = (() => {
    if (!isReady) return "landing";
    if (user) {
      if (state === "onboarding") return "onboarding";
      if (state === "lesson") return "lesson";
      return "dashboard";
    }
    return state;
  })();

  const handleOnboardingComplete = async (userConfig: UserConfig) => {
    setConfig(userConfig);
    // Save preferences to profile
    if (user) {
      await supabase.from("profiles").update({
        interests: userConfig.interests,
        learning_style: userConfig.learningStyle,
        accessibility: userConfig.accessibility,
      }).eq("user_id", user.id);
    }
    setState("dashboard");
  };

  const handleAuth = () => {
    // After successful auth, check if user needs onboarding
    setState("onboarding");
  };

  switch (effectiveState) {
    case "landing":
      return <Landing onGetStarted={() => setState("auth")} />;
    case "auth":
      return (
        <AuthPage
          onAuth={handleAuth}
          signUp={signUp}
          signIn={signIn}
          resetPassword={resetPassword}
        />
      );
    case "onboarding":
      return <Onboarding onComplete={handleOnboardingComplete} />;
    case "dashboard":
      return (
        <Dashboard
          config={config}
          onStartLesson={() => setState("lesson")}
          user={user!}
          onSignOut={async () => {
            await signOut();
            setState("landing");
          }}
        />
      );
    case "lesson":
      return <LessonView onBack={() => setState("dashboard")} />;
  }
};

export default Index;
