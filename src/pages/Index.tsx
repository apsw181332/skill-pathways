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
import PathComplete from "@/components/PathComplete";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { COURSES } from "@/lib/courseData";
import Tutorial from "@/components/Tutorial";
import SettingsPage from "@/components/Settings";
import { applyAccessibilityModes } from "@/lib/accessibility";
import ChatBot from "@/components/ChatBot";
import AISuggestion from "@/components/AISuggestion";
import { getCountryCoords } from "@/lib/countries";
import type { Locale } from "@/lib/i18n";

type AppState = "landing" | "auth" | "onboarding" | "tutorial" | "dashboard" | "lesson" | "settings" | "path-complete";

const Index = () => {
  const { user, isReady, signUp, signIn, signOut, resetPassword } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin(user?.id);
  const { settings, loading: settingsLoading, updateSetting, enrollCourse, unenrollCourse } = useSettings(user?.id);
  const [state, setState] = useState<AppState>("landing");
  const [config, setConfig] = useState<UserConfig>({ interests: [], learningStyle: "", accessibility: [], accessibilityModes: [] });
  const [activeLessonCategory, setActiveLessonCategory] = useState("tech");
  const [activeLessonId, setActiveLessonId] = useState(1);
  const [activeLessonReview, setActiveLessonReview] = useState(false);
  const [completedCourse, setCompletedCourse] = useState<typeof COURSES[0] | null>(null);
  const [gems, setGems] = useState(0);
  const [extraLives, setExtraLives] = useState(0);

  useEffect(() => {
    if (!settingsLoading) {
      applyThemeColor(settings.theme_color);
      applyAccessibilityModes(settings.accessibility_modes || []);
    }
  }, [settings.theme_color, settings.accessibility_modes, settingsLoading]);

  useEffect(() => {
    if (!user) return;
    const fetchGems = async () => {
      const { data } = await supabase.from("profiles").select("gems").eq("user_id", user.id).single();
      if (data) setGems((data as any).gems || 0);
    };
    fetchGems();
    const channel = supabase.channel("gems-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => { setGems((payload.new as any).gems || 0); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const effectiveState = (() => {
    if (!isReady || settingsLoading) return "landing";
    if (user) {
      if (state === "lesson") return "lesson";
      if (state === "path-complete") return "path-complete";
      if (state === "settings") return "settings";
      if (!settings.onboarding_completed && state !== "dashboard") return "onboarding";
      if (settings.onboarding_completed && !settings.tutorial_completed && state === "tutorial") return "tutorial";
      return "dashboard";
    }
    return state;
  })();

  const handleOnboardingComplete = async (userConfig: UserConfig) => {
    setConfig(userConfig);
    if (user) {
      // Geocode country
      const coords = userConfig.country ? getCountryCoords(userConfig.country) : null;
      await supabase.from("profiles").update({
        interests: userConfig.interests, learning_style: userConfig.learningStyle,
        accessibility: userConfig.accessibility, onboarding_completed: true,
        accessibility_modes: userConfig.accessibilityModes || [],
        country: userConfig.country || null,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      } as any).eq("user_id", user.id);
      await updateSetting("onboarding_completed", true);
      // Apply accessibility modes from onboarding immediately
      if (userConfig.accessibilityModes?.length) {
        applyAccessibilityModes(userConfig.accessibilityModes);
        await updateSetting("accessibility_modes", userConfig.accessibilityModes);
      }
    }
    setState("tutorial");
  };

  const handleTutorialComplete = async () => {
    if (user) {
      await supabase.from("profiles").update({ tutorial_completed: true } as any).eq("user_id", user.id);
      await updateSetting("tutorial_completed", true);
    }
    setState("dashboard");
  };

  const handleAuth = () => setState("onboarding");
  const handleSignOut = async () => { await signOut(); setState("landing"); };
  const handleStartLesson = (categoryId: string, lessonId: number, isReview: boolean = false) => {
    setActiveLessonCategory(categoryId);
    setActiveLessonId(lessonId);
    setActiveLessonReview(isReview);
    setState("lesson");
  };

  const handleUseExtraLife = () => {
    if (extraLives > 0) setExtraLives(prev => prev - 1);
  };

  if (isReady && user && !adminLoading && isAdmin) return <AdminDashboard onSignOut={handleSignOut} />;

  switch (effectiveState) {
    case "landing": return <Landing onGetStarted={() => setState("auth")} />;
    case "auth": return <AuthPage onAuth={handleAuth} signUp={signUp} signIn={signIn} resetPassword={resetPassword} />;
    case "onboarding": return <Onboarding onComplete={handleOnboardingComplete} />;
    case "tutorial": return <Tutorial onComplete={handleTutorialComplete} />;
    case "settings": return <SettingsPage settings={settings} onUpdate={updateSetting} onBack={() => setState("dashboard")} locale={(settings.language || "en") as Locale} />;
    case "dashboard":
      return (
        <>
          <Dashboard config={config} onStartLesson={handleStartLesson} user={user!} onSignOut={handleSignOut}
            onOpenSettings={() => setState("settings")} enrolledCourses={settings.enrolled_courses}
            onEnroll={enrollCourse} onUnenroll={unenrollCourse}
            gems={gems} extraLives={extraLives} locale={(settings.language || "en") as Locale}
            onPurchase={async (itemId, cost) => {
              if (gems < cost) return false;
              const newGems = gems - cost;
              await supabase.from("profiles").update({ gems: newGems } as any).eq("user_id", user!.id);
              setGems(newGems);
              if (itemId === "extra-life") setExtraLives(prev => prev + 1);
              if (itemId === "life-pack") setExtraLives(prev => prev + 3);
              if (itemId.startsWith("title-")) {
                await supabase.from("profiles").update({ title: itemId } as any).eq("user_id", user!.id);
              }
              return true;
            }}
          />
          <ChatBot />
          <AISuggestion userId={user!.id} enrolledCourses={settings.enrolled_courses} onEnroll={enrollCourse} />
        </>
      );
    case "path-complete":
      return completedCourse ? (
        <PathComplete
          course={completedCourse}
          totalXp={0}
          onContinue={() => { setCompletedCourse(null); setState("dashboard"); }}
        />
      ) : null;
    case "lesson":
      return (
        <LessonView onBack={async () => {
          if (user && !activeLessonReview) {
            const course = COURSES.find(c => c.id === activeLessonCategory);
            if (course) {
              const { data: progress } = await supabase.from("user_progress")
                .select("lesson_id")
                .eq("user_id", user.id)
                .eq("category_id", activeLessonCategory)
                .eq("completed", true);
              const completedCount = progress?.length || 0;
              if (completedCount >= course.lessons.length && settings.enrolled_courses.includes(activeLessonCategory)) {
                await unenrollCourse(activeLessonCategory);
                setCompletedCourse(course);
                setState("path-complete");
                return;
              }
            }
          }
          setState("dashboard");
        }} userId={user?.id}
          categoryId={activeLessonCategory} lessonId={activeLessonId} soundEnabled={settings.sound_enabled}
          ttsEnabled={settings.tts_enabled}
          extraLives={extraLives} onUseExtraLife={handleUseExtraLife} isReview={activeLessonReview} />
      );
  }
};

export default Index;
