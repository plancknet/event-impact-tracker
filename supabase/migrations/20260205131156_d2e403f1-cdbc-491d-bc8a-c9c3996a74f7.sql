-- Disable RLS for quiz_responses - this is a public quiz without sensitive data
-- The quiz is designed for anonymous users, so RLS is not needed here
ALTER TABLE public.quiz_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_responses NO FORCE ROW LEVEL SECURITY;

-- Drop all the policies since RLS is disabled
DROP POLICY IF EXISTS "quiz_insert_all" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_select_own" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_select_admin" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_update_anon" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_update_auth" ON public.quiz_responses;
DROP POLICY IF EXISTS "quiz_update_public" ON public.quiz_responses;