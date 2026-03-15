import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import Landing from "@/components/Landing";
import AuthPage from "@/components/AuthPage";
import Onboarding, { type UserConfig } from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import LessonView from "@/components/LessonView";
import AdminDashboard from "@/components/admin/AdminDashboard";

type AppState = "landing" | "auth" | "onboarding" | "dashboard" | "lesson";

const Index = () => {
  const { user, isReady, signUp, signIn, signOut, resetPassword } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const [state, setState] = useState<AppState>("landing");
  const [config, setConfig] = useState<UserConfig>({
    interests: [],
    learningStyle: "",
    accessibility: [],
  });

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
    setState("onboarding");
  };

  const handleSignOut = async () => {
    await signOut();
    setState("landing");
  };

  // If admin is logged in, show admin dashboard
  if (isReady && user && !adminLoading && isAdmin) {
    return <AdminDashboard onSignOut={handleSignOut} />;
  }

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
          onSignOut={handleSignOut}
        />
      );
    case "lesson":
      return <LessonView onBack={() => setState("dashboard")} userId={user?.id} />;
  }
};

export default Index;
