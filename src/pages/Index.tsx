import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useSettings, applyThemeColor } from "@/hooks/useSettings";
import { supabase } from "@/integrations/supabase/client";
import Landing from "@/components/Landing";
import AuthPage from "@/components/AuthPage";
import Onboarding, { type UserConfig } from "@/components/Onboarding";
import Dashboard from "@/components/Dashboard";
import LessonView from "@/components/LessonView";
import AdminDashboard from "@/components/admin/AdminDashboard";
import Tutorial from "@/components/Tutorial";
import SettingsPage from "@/components/Settings";
import ChatBot from "@/components/ChatBot";

type AppState = "landing" | "auth" | "onboarding" | "tutorial" | "dashboard" | "lesson" | "settings";

const Index = () => {
  const { user, isReady, signUp, signIn, signOut, resetPassword } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const { settings, loading: settingsLoading, updateSetting, enrollCourse, unenrollCourse } = useSettings(user?.id);
  const [state, setState] = useState<AppState>("landing");
  const [config, setConfig] = useState<UserConfig>({ interests: [], learningStyle: "", accessibility: [] });
  const [activeLessonCategory, setActiveLessonCategory] = useState("tech");
  const [activeLessonId, setActiveLessonId] = useState(1);

  // Apply theme color on load
  useEffect(() => {
    if (!settingsLoading) {
      applyThemeColor(settings.theme_color);
    }
  }, [settings.theme_color, settingsLoading]);

  // Determine effective state based on auth and settings
  const effectiveState = (() => {
    if (!isReady || settingsLoading) return "landing";
    if (user) {
      if (state === "lesson") return "lesson";
      if (state === "settings") return "settings";
      // First-time user: show onboarding if not completed
      if (!settings.onboarding_completed && state !== "dashboard") return "onboarding";
      // Show tutorial after onboarding if not completed
      if (settings.onboarding_completed && !settings.tutorial_completed && state === "tutorial") return "tutorial";
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
        onboarding_completed: true,
      } as any).eq("user_id", user.id);
      await updateSetting("onboarding_completed", true);
    }
    // After onboarding, show tutorial
    setState("tutorial");
  };

  const handleTutorialComplete = async () => {
    if (user) {
      await supabase.from("profiles").update({ tutorial_completed: true } as any).eq("user_id", user.id);
      await updateSetting("tutorial_completed", true);
    }
    setState("dashboard");
  };

  const handleAuth = () => {
    // After auth, check if onboarding is needed
    setState("onboarding");
  };

  const handleSignOut = async () => {
    await signOut();
    setState("landing");
  };

  const handleStartLesson = (categoryId: string, lessonId: number) => {
    setActiveLessonCategory(categoryId);
    setActiveLessonId(lessonId);
    setState("lesson");
  };

  // Admin check
  if (isReady && user && !adminLoading && isAdmin) {
    return <AdminDashboard onSignOut={handleSignOut} />;
  }

  switch (effectiveState) {
    case "landing":
      return <Landing onGetStarted={() => setState("auth")} />;
    case "auth":
      return <AuthPage onAuth={handleAuth} signUp={signUp} signIn={signIn} resetPassword={resetPassword} />;
    case "onboarding":
      return <Onboarding onComplete={handleOnboardingComplete} />;
    case "tutorial":
      return <Tutorial onComplete={handleTutorialComplete} />;
    case "settings":
      return (
        <SettingsPage
          settings={settings}
          onUpdate={updateSetting}
          onBack={() => setState("dashboard")}
        />
      );
    case "dashboard":
      return (
        <>
          <Dashboard
            config={config}
            onStartLesson={handleStartLesson}
            user={user!}
            onSignOut={handleSignOut}
            onOpenSettings={() => setState("settings")}
            enrolledCourses={settings.enrolled_courses}
            onEnroll={enrollCourse}
            onUnenroll={unenrollCourse}
          />
          <ChatBot />
        </>
      );
    case "lesson":
      return (
        <LessonView
          onBack={() => setState("dashboard")}
          userId={user?.id}
          categoryId={activeLessonCategory}
          lessonId={activeLessonId}
          soundEnabled={settings.sound_enabled}
          ttsEnabled={settings.tts_enabled}
        />
      );
  }
};

export default Index;
