-- Drop existing restrictive policies on quiz_responses
DROP POLICY IF EXISTS "Anyone can insert quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Users can view their own quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Anyone can update recent quiz responses" ON public.quiz_responses;

-- Create new PERMISSIVE policies for quiz_responses

-- Allow anyone to insert a quiz response
CREATE POLICY "Allow insert quiz responses"
ON public.quiz_responses
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to view their own responses
CREATE POLICY "Allow select own quiz responses"
ON public.quiz_responses
FOR SELECT
TO public
USING (auth.uid() = user_id);

-- Allow admins to view all quiz responses
CREATE POLICY "Allow admin select all quiz responses"
ON public.quiz_responses
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow anonymous users to update recent quiz responses (within 1 hour of creation)
CREATE POLICY "Allow update recent anonymous quiz responses"
ON public.quiz_responses
FOR UPDATE
TO public
USING (
  (user_id IS NULL AND created_at > (now() - interval '1 hour'))
  OR auth.uid() = user_id
)
WITH CHECK (
  (user_id IS NULL AND created_at > (now() - interval '1 hour'))
  OR auth.uid() = user_id
);