
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS tutorial_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS enrolled_courses text[] NOT NULL DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS theme_color text NOT NULL DEFAULT 'blue',
ADD COLUMN IF NOT EXISTS tts_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT true;
