
-- Drop the existing restrictive policies and recreate as permissive

-- UPDATE policy: allow updates within 5 minutes of creation (for anonymous users)
DROP POLICY IF EXISTS "quiz_update_recent" ON public.quiz_responses;
CREATE POLICY "quiz_update_recent"
  ON public.quiz_responses
  FOR UPDATE
  USING (created_at > (now() - interval '5 minutes'))
  WITH CHECK (created_at > (now() - interval '5 minutes'));

-- INSERT policy: allow anonymous inserts
DROP POLICY IF EXISTS "quiz_insert_anon" ON public.quiz_responses;
CREATE POLICY "quiz_insert_anon"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK ((user_id IS NULL) OR (auth.uid() = user_id));

-- SELECT policies: own data or admin
DROP POLICY IF EXISTS "quiz_select_own" ON public.quiz_responses;
CREATE POLICY "quiz_select_own"
  ON public.quiz_responses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "quiz_select_admin" ON public.quiz_responses;
CREATE POLICY "quiz_select_admin"
  ON public.quiz_responses
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
