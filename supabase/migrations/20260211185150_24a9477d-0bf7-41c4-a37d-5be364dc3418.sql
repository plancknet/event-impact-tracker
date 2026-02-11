
-- Increase the update window to 30 minutes to prevent timing issues
DROP POLICY IF EXISTS "quiz_update_recent" ON public.quiz_responses;
CREATE POLICY "quiz_update_recent"
  ON public.quiz_responses
  FOR UPDATE
  USING (created_at > (now() - interval '30 minutes'))
  WITH CHECK (created_at > (now() - interval '30 minutes'));
