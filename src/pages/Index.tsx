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
import PathSelection from "@/components/PathSelection";
import AdminDashboard from "@/components/admin/AdminDashboard";
import { COURSES } from "@/lib/courseData";
import Tutorial from "@/components/Tutorial";
import SettingsPage from "@/components/Settings";
import { applyAccessibilityModes } from "@/lib/accessibility";
import ChatBot from "@/components/ChatBot";
import AISuggestion from "@/components/AISuggestion";
import { getCountryCoords } from "@/lib/countries";
import { generateLearningCode } from "@/lib/learningCode";
import PageTransition from "@/components/PageTransition";
import type { Locale } from "@/lib/i18n";

type AppState = "landing" | "auth" | "onboarding" | "path-selection" | "tutorial" | "dashboard" | "lesson" | "settings" | "path-complete";

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
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [chosenPath, setChosenPath] = useState<string | null>(null);

  const currentLocale = (settings.language || "en") as Locale;

  useEffect(() => {
    if (!settingsLoading) {
      applyThemeColor(settings.theme_color);
      applyAccessibilityModes(settings.accessibility_modes || []);
    }
  }, [settings.theme_color, settings.accessibility_modes, settingsLoading]);

  // Fetch gems and chosen_path
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("gems, chosen_path").eq("user_id", user.id).single();
      if (data) {
        setGems((data as any).gems || 0);
        setChosenPath((data as any).chosen_path || null);
      }
    };
    fetchProfile();
    const channel = supabase.channel("gems-sync")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `user_id=eq.${user.id}` },
        (payload) => {
          setGems((payload.new as any).gems || 0);
          if ((payload.new as any).chosen_path) setChosenPath((payload.new as any).chosen_path);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const effectiveState = (() => {
    if (!isReady || settingsLoading) return "landing";
    if (user) {
      if (state === "lesson") return "lesson";
      if (state === "path-complete") return "path-complete";
      if (state === "settings") return "settings";
      if (state === "path-selection") return "path-selection";
      if (!settings.onboarding_completed && state !== "dashboard") return "onboarding";
      if (settings.onboarding_completed && !settings.tutorial_completed && state === "tutorial") return "tutorial";
      return "dashboard";
    }
    return state;
  })();

  const handleOnboardingComplete = async (userConfig: UserConfig) => {
    setConfig(userConfig);
    if (user) {
      const learningCode = generateLearningCode(
        userConfig.learningStyle,
        userConfig.interests,
        userConfig.accessibilityModes || []
      );
      const coords = userConfig.country ? getCountryCoords(userConfig.country) : null;

      // Auto-enroll matching courses based on selected interests (up to 3)
      const interestToCourse: Record<string, string> = {
        financial: "financial", home: "home", cooking: "cooking",
        social: "social", career: "career", health: "health",
        legal: "legal", tech: "tech",
      };
      const autoEnroll = userConfig.interests
        .map(i => interestToCourse[i])
        .filter(Boolean)
        .slice(0, 3);

      await supabase.from("profiles").update({
        interests: userConfig.interests, learning_style: userConfig.learningStyle,
        accessibility: userConfig.accessibility, onboarding_completed: true,
        accessibility_modes: userConfig.accessibilityModes || [],
        country: userConfig.country || null,
        learning_code: learningCode,
        enrolled_courses: autoEnroll,
        ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
      } as any).eq("user_id", user.id);
      await updateSetting("onboarding_completed", true);
      for (const courseId of autoEnroll) {
        await enrollCourse(courseId);
      }
      if (userConfig.accessibilityModes?.length) {
        applyAccessibilityModes(userConfig.accessibilityModes);
        await updateSetting("accessibility_modes", userConfig.accessibilityModes);
      }
    }
    // Go to path selection instead of tutorial
    setState("path-selection");
  };

  const handlePathSelected = async (pathId: string) => {
    setChosenPath(pathId);
    if (user) {
      await supabase.from("profiles").update({ chosen_path: pathId } as any).eq("user_id", user.id);
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
    setIsTransitioning(true);
    setActiveLessonCategory(categoryId);
    setActiveLessonId(lessonId);
    setActiveLessonReview(isReview);
    setTimeout(() => {
      setState("lesson");
      setTimeout(() => setIsTransitioning(false), 400);
    }, 300);
  };

  const handleUseExtraLife = () => {
    if (extraLives > 0) setExtraLives(prev => prev - 1);
  };

  const handleStateChange = (newState: AppState) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setState(newState);
      setTimeout(() => setIsTransitioning(false), 400);
    }, 300);
  };

  if (isReady && user && !adminLoading && isAdmin) return <AdminDashboard onSignOut={handleSignOut} />;

  const renderContent = () => {
    switch (effectiveState) {
      case "landing": return <Landing onGetStarted={() => setState("auth")} />;
      case "auth": return <AuthPage onAuth={handleAuth} signUp={signUp} signIn={signIn} resetPassword={resetPassword} />;
      case "onboarding": return <Onboarding onComplete={handleOnboardingComplete} />;
      case "path-selection": return <PathSelection interests={config.interests} onSelect={handlePathSelected} />;
      case "tutorial": return <Tutorial onComplete={handleTutorialComplete} />;
      case "settings": return <SettingsPage settings={settings} onUpdate={updateSetting} onBack={() => handleStateChange("dashboard")} locale={currentLocale} userId={user?.id} />;
      case "dashboard":
        return (
          <>
            <Dashboard config={config} onStartLesson={handleStartLesson} user={user!} onSignOut={handleSignOut}
              onOpenSettings={() => handleStateChange("settings")} enrolledCourses={settings.enrolled_courses}
              onEnroll={enrollCourse} onUnenroll={unenrollCourse}
              gems={gems} extraLives={extraLives} locale={currentLocale}
              chosenPath={chosenPath}
              onPurchase={async (itemId, cost) => {
                if (gems < cost) return false;
                if (itemId.startsWith("title-")) return false;
                const newGems = gems - cost;
                await supabase.from("profiles").update({ gems: newGems } as any).eq("user_id", user!.id);
                setGems(newGems);
                if (itemId === "extra-life") setExtraLives(prev => prev + 1);
                if (itemId === "life-pack") setExtraLives(prev => prev + 3);
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
            onContinue={() => { setCompletedCourse(null); handleStateChange("dashboard"); }}
          />
        ) : null;
      case "lesson":
        return (
          <LessonView key={`${activeLessonCategory}-${activeLessonId}-${activeLessonReview ? "review" : "lesson"}`} onBack={async () => {
            setIsTransitioning(true);
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
                  setTimeout(() => setIsTransitioning(false), 400);
                  return;
                }
              }
            }
            setState("dashboard");
            setTimeout(() => setIsTransitioning(false), 400);
          }}
            onNextLesson={async (catId, nextLessonId) => {
              if (user) {
                const course = COURSES.find(c => c.id === catId);
                if (course) {
                  const { data: progress } = await supabase.from("user_progress")
                    .select("lesson_id")
                    .eq("user_id", user.id)
                    .eq("category_id", catId)
                    .eq("completed", true);
                  const completedCount = progress?.length || 0;
                  if (completedCount >= course.lessons.length && settings.enrolled_courses.includes(catId)) {
                    setIsTransitioning(true);
                    await unenrollCourse(catId);
                    setCompletedCourse(course);
                    setState("path-complete");
                    setTimeout(() => setIsTransitioning(false), 400);
                    return;
                  }
                }
              }
              handleStartLesson(catId, nextLessonId);
            }}
            userId={user?.id}
            categoryId={activeLessonCategory} lessonId={activeLessonId} soundEnabled={settings.sound_enabled}
            ttsEnabled={settings.tts_enabled} locale={currentLocale}
            extraLives={extraLives} onUseExtraLife={handleUseExtraLife} isReview={activeLessonReview}
            chosenPath={chosenPath}
            config={{ learningStyle: config.learningStyle }} />
        );
    }
  };

  return (
    <>
      <PageTransition isVisible={isTransitioning} />
      {renderContent()}
    </>
  );
};

export default Index;
