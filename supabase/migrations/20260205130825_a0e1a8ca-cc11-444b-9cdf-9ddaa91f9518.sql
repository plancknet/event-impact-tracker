-- Drop the current update policy and create a simpler one
DROP POLICY IF EXISTS "Allow update recent anonymous quiz responses" ON public.quiz_responses;

-- Create a more permissive update policy for testing
-- Allow updates to any row created in the last hour regardless of user_id
CREATE POLICY "Allow update recent quiz responses"
ON public.quiz_responses
FOR UPDATE
TO public
USING (created_at > (now() - interval '1 hour'))
WITH CHECK (created_at > (now() - interval '1 hour'));