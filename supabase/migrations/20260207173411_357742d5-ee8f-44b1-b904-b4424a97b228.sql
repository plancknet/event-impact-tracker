-- Re-enable RLS on quiz_responses table
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Anyone can insert quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Users can update quiz responses" ON public.quiz_responses;
DROP POLICY IF EXISTS "Anyone can update recent quiz responses" ON public.quiz_responses;

-- Anonymous and authenticated users can insert quiz responses
CREATE POLICY "quiz_insert_anon" ON public.quiz_responses 
  FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

-- Users can view their own responses
CREATE POLICY "quiz_select_own" ON public.quiz_responses 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Admins can view all responses (for analytics)
CREATE POLICY "quiz_select_admin" ON public.quiz_responses 
  FOR SELECT TO authenticated 
  USING (has_role(auth.uid(), 'admin'));

-- Anonymous can update very recent responses (quiz progress tracking during session)
-- Reduced from 1 hour to 5 minutes for better security
CREATE POLICY "quiz_update_recent" ON public.quiz_responses 
  FOR UPDATE TO anon, authenticated
  USING (created_at > (now() - interval '5 minutes'))
  WITH CHECK (created_at > (now() - interval '5 minutes'));