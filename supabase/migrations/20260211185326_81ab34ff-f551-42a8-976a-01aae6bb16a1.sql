
-- The issue is that PostgREST/RLS for anon users needs explicit handling
-- Let's add a specific policy that explicitly allows anon updates within the time window
DROP POLICY IF EXISTS "quiz_update_recent" ON public.quiz_responses;

-- Create policy that works for both anon and authenticated users
CREATE POLICY "quiz_update_recent"
  ON public.quiz_responses
  FOR UPDATE
  TO anon, authenticated
  USING (created_at > (now() - interval '30 minutes'))
  WITH CHECK (created_at > (now() - interval '30 minutes'));
