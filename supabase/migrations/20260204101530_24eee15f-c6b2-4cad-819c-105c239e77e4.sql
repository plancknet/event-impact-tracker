-- Fix security issues: Remove public access to sensitive quiz data

-- 1. Drop the insecure SELECT policy on quiz_responses that exposes emails
DROP POLICY IF EXISTS "Users can view their own quiz responses" ON public.quiz_responses;

-- 2. Create a secure SELECT policy that only allows authenticated users to view their own responses
CREATE POLICY "Users can view their own quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (auth.uid() = user_id);

-- 3. Drop the public SELECT policy on quiz_sessions that exposes tracking data
DROP POLICY IF EXISTS "Anyone can view quiz sessions" ON public.quiz_sessions;

-- 4. Create a secure SELECT policy for quiz_sessions - only authenticated users can view sessions linked to their quiz responses
CREATE POLICY "Users can view their own quiz sessions" 
ON public.quiz_sessions 
FOR SELECT 
USING (
  quiz_response_id IN (
    SELECT id FROM public.quiz_responses WHERE user_id = auth.uid()
  )
);