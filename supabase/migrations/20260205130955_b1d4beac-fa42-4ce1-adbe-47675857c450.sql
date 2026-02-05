-- Re-enable RLS 
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow insert quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Allow select own quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Allow admin select all quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Allow update recent quiz responses" ON public.quiz_responses;

-- Create policies with anon role explicitly
CREATE POLICY "quiz_insert_all" ON public.quiz_responses FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "quiz_select_own" ON public.quiz_responses FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "quiz_select_admin" ON public.quiz_responses FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Allow anon to update any row created in the last hour (no user_id check)
CREATE POLICY "quiz_update_anon" ON public.quiz_responses FOR UPDATE TO anon
  USING (created_at > (now() - interval '1 hour'))
  WITH CHECK (created_at > (now() - interval '1 hour'));

-- Allow authenticated to update own rows
CREATE POLICY "quiz_update_auth" ON public.quiz_responses FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);