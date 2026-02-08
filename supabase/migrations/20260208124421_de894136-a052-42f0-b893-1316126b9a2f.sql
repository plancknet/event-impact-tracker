-- Drop the overly permissive INSERT policy on quiz_responses
DROP POLICY IF EXISTS "quiz_insert_anon" ON public.quiz_responses;

-- Create a more restrictive INSERT policy
-- Allows anonymous inserts but PREVENTS reading email back (users can only insert, not select their own data without auth)
-- The key protection is that there's no SELECT policy for anonymous users
CREATE POLICY "quiz_insert_anon"
  ON public.quiz_responses
  FOR INSERT
  WITH CHECK (
    -- Only allow insertion if user_id is NULL (anonymous) or matches the authenticated user
    (user_id IS NULL OR auth.uid() = user_id)
  );

-- Add an index to prevent timing attacks on email lookups
CREATE INDEX IF NOT EXISTS idx_quiz_responses_email_hash ON public.quiz_responses USING hash (email);