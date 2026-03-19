
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stamina integer NOT NULL DEFAULT 30;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stamina_last_refresh timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_pro boolean NOT NULL DEFAULT false;
