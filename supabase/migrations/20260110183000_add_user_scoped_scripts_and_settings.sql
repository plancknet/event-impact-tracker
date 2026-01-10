ALTER TABLE public.teleprompter_scripts
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

DROP POLICY IF EXISTS "Allow all operations on teleprompter_scripts" ON public.teleprompter_scripts;

CREATE POLICY "Users can view their own scripts"
  ON public.teleprompter_scripts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scripts"
  ON public.teleprompter_scripts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scripts"
  ON public.teleprompter_scripts
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.teleprompter_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  settings_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teleprompter_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own teleprompter settings"
  ON public.teleprompter_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own teleprompter settings"
  ON public.teleprompter_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own teleprompter settings"
  ON public.teleprompter_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_teleprompter_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teleprompter_settings_updated_at
BEFORE UPDATE ON public.teleprompter_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_teleprompter_settings_updated_at();
