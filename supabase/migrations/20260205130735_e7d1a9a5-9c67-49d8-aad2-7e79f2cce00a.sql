-- Grant necessary permissions to anon and authenticated roles for quiz_responses
GRANT SELECT, INSERT, UPDATE ON public.quiz_responses TO anon;
GRANT SELECT, INSERT, UPDATE ON public.quiz_responses TO authenticated;

-- Also ensure the quiz_sessions table has proper grants
GRANT SELECT, INSERT, UPDATE ON public.quiz_sessions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.quiz_sessions TO authenticated;