
-- Table to track demo usage sessions
CREATE TABLE public.demo_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_started_at timestamptz NOT NULL DEFAULT now(),
  user_name text,
  name_captured_at timestamptz,
  topic text,
  topic_captured_at timestamptz,
  tone text,
  tone_selected_at timestamptz,
  news_selected_at timestamptz,
  news_count integer DEFAULT 0,
  script_generated_at timestamptz,
  teleprompter_started_at timestamptz,
  teleprompter_completed_at timestamptz,
  sales_page_viewed_at timestamptz,
  checkout_button_1_at timestamptz,
  checkout_button_2_at timestamptz,
  restart_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (demo is for non-logged users)
CREATE POLICY "demo_insert_anon" ON public.demo_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Anyone can update recent sessions (within 30 min)
CREATE POLICY "demo_update_recent" ON public.demo_sessions
  FOR UPDATE TO anon, authenticated
  USING (created_at > (now() - interval '30 minutes'))
  WITH CHECK (created_at > (now() - interval '30 minutes'));

-- Admins can read all
CREATE POLICY "demo_select_admin" ON public.demo_sessions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RPC to update demo session safely
CREATE OR REPLACE FUNCTION public.update_demo_session(_session_id uuid, _data jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _created_at timestamptz;
BEGIN
  SELECT created_at INTO _created_at FROM demo_sessions WHERE id = _session_id;
  IF _created_at IS NULL THEN RAISE EXCEPTION 'Session not found'; END IF;
  IF _created_at < (now() - interval '30 minutes') THEN RAISE EXCEPTION 'Session expired'; END IF;

  UPDATE demo_sessions SET
    user_name = COALESCE((_data->>'user_name'), user_name),
    name_captured_at = COALESCE((_data->>'name_captured_at')::timestamptz, name_captured_at),
    topic = COALESCE((_data->>'topic'), topic),
    topic_captured_at = COALESCE((_data->>'topic_captured_at')::timestamptz, topic_captured_at),
    tone = COALESCE((_data->>'tone'), tone),
    tone_selected_at = COALESCE((_data->>'tone_selected_at')::timestamptz, tone_selected_at),
    news_selected_at = COALESCE((_data->>'news_selected_at')::timestamptz, news_selected_at),
    news_count = COALESCE((_data->>'news_count')::integer, news_count),
    script_generated_at = COALESCE((_data->>'script_generated_at')::timestamptz, script_generated_at),
    teleprompter_started_at = COALESCE((_data->>'teleprompter_started_at')::timestamptz, teleprompter_started_at),
    teleprompter_completed_at = COALESCE((_data->>'teleprompter_completed_at')::timestamptz, teleprompter_completed_at),
    sales_page_viewed_at = COALESCE((_data->>'sales_page_viewed_at')::timestamptz, sales_page_viewed_at),
    checkout_button_1_at = COALESCE((_data->>'checkout_button_1_at')::timestamptz, checkout_button_1_at),
    checkout_button_2_at = COALESCE((_data->>'checkout_button_2_at')::timestamptz, checkout_button_2_at),
    restart_at = COALESCE((_data->>'restart_at')::timestamptz, restart_at),
    updated_at = now()
  WHERE id = _session_id;
END;
$$;
