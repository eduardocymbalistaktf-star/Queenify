CREATE TABLE IF NOT EXISTS public.member_area_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT member_area_settings_settings_object CHECK (jsonb_typeof(settings) = 'object')
);

ALTER TABLE public.member_area_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own member area settings" ON public.member_area_settings;
CREATE POLICY "Users manage own member area settings"
  ON public.member_area_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_area_settings TO authenticated;
