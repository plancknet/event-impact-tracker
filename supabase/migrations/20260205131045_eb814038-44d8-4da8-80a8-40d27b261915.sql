-- Force RLS for all roles including table owners
ALTER TABLE public.quiz_responses FORCE ROW LEVEL SECURITY;