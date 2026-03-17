import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSettings {
  theme_color: string;
  sound_enabled: boolean;
  tts_enabled: boolean;
  onboarding_completed: boolean;
  tutorial_completed: boolean;
  enrolled_courses: string[];
  language: string;
  accessibility_modes: string[];
}

const DEFAULTS: UserSettings = {
  theme_color: "blue",
  sound_enabled: true,
  tts_enabled: false,
  onboarding_completed: false,
  tutorial_completed: false,
  enrolled_courses: [],
  language: "en",
  accessibility_modes: [],
};

export function useSettings(userId?: string) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("theme_color, sound_enabled, onboarding_completed, tutorial_completed, enrolled_courses")
        .eq("user_id", userId)
        .single();
      if (data) {
        setSettings({
          theme_color: (data as any).theme_color || "blue",
          sound_enabled: (data as any).sound_enabled ?? true,
          onboarding_completed: (data as any).onboarding_completed ?? false,
          tutorial_completed: (data as any).tutorial_completed ?? false,
          enrolled_courses: (data as any).enrolled_courses || [],
        });
      }
      setLoading(false);
    };
    fetchSettings();
  }, [userId]);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    if (userId) {
      await supabase.from("profiles").update({ [key]: value } as any).eq("user_id", userId);
    }
  }, [userId]);

  const enrollCourse = useCallback(async (courseId: string) => {
    if (settings.enrolled_courses.length >= 3) return false;
    if (settings.enrolled_courses.includes(courseId)) return true;
    const newCourses = [...settings.enrolled_courses, courseId];
    await updateSetting("enrolled_courses", newCourses);
    return true;
  }, [settings.enrolled_courses, updateSetting]);

  const unenrollCourse = useCallback(async (courseId: string) => {
    const newCourses = settings.enrolled_courses.filter(c => c !== courseId);
    await updateSetting("enrolled_courses", newCourses);
  }, [settings.enrolled_courses, updateSetting]);

  return { settings, loading, updateSetting, enrollCourse, unenrollCourse };
}

export const THEME_COLORS: Record<string, { primary: string; ring: string; label: string }> = {
  blue: { primary: "230 58% 48%", ring: "230 58% 48%", label: "Ocean Blue" },
  green: { primary: "152 55% 40%", ring: "152 55% 40%", label: "Forest Green" },
  purple: { primary: "270 55% 50%", ring: "270 55% 50%", label: "Royal Purple" },
  orange: { primary: "25 85% 55%", ring: "25 85% 55%", label: "Sunset Orange" },
  red: { primary: "0 65% 50%", ring: "0 65% 50%", label: "Ruby Red" },
  pink: { primary: "330 65% 55%", ring: "330 65% 55%", label: "Rose Pink" },
  teal: { primary: "180 55% 40%", ring: "180 55% 40%", label: "Tropical Teal" },
};

export function applyThemeColor(color: string) {
  const theme = THEME_COLORS[color] || THEME_COLORS.blue;
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--ring", theme.ring);
}
