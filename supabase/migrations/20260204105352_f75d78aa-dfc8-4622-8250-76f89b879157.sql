-- Fix UPDATE policy for quiz_responses to allow anonymous updates within 1 hour
DROP POLICY IF EXISTS "Users can update quiz responses" ON public.quiz_responses;

CREATE POLICY "Anyone can update recent quiz responses"
  ON public.quiz_responses
  FOR UPDATE
  USING (
    -- Allow update if: owned by user OR (anonymous AND created within 1 hour)
    (auth.uid() = user_id) 
    OR 
    (user_id IS NULL AND created_at > (now() - interval '1 hour'))
  );

-- Fix UPDATE policy for quiz_sessions to allow anonymous updates within 1 hour  
DROP POLICY IF EXISTS "Anyone can update recent quiz sessions" ON public.quiz_sessions;

CREATE POLICY "Anyone can update recent quiz sessions"
  ON public.quiz_sessions
  FOR UPDATE
  USING (
    created_at > (now() - interval '1 hour')
  );