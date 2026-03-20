
-- Voice mentor sessions
CREATE TABLE public.voice_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skill_topic text NOT NULL,
  lesson_id text,
  duration_seconds integer DEFAULT 0,
  exchange_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own voice sessions" ON public.voice_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice sessions" ON public.voice_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own voice sessions" ON public.voice_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice sessions" ON public.voice_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Voice exchanges within a session
CREATE TABLE public.voice_exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.voice_sessions(id) ON DELETE CASCADE NOT NULL,
  user_text text NOT NULL,
  mentor_text text NOT NULL,
  exchange_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.voice_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own voice exchanges" ON public.voice_exchanges
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.voice_sessions vs WHERE vs.id = session_id AND vs.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.voice_sessions vs WHERE vs.id = session_id AND vs.user_id = auth.uid()));
