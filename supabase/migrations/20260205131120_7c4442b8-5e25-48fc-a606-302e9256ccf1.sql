-- Add policy for public role which is the default role in PostgREST
CREATE POLICY "quiz_update_public" ON public.quiz_responses FOR UPDATE TO public
  USING (created_at > (now() - interval '1 hour'))
  WITH CHECK (created_at > (now() - interval '1 hour'));