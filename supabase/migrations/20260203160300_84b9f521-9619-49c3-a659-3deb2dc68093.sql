-- Create quiz_sessions table for tracking analytics
CREATE TABLE public.quiz_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_response_id UUID REFERENCES public.quiz_responses(id) ON DELETE CASCADE,
  session_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  device_info JSONB DEFAULT '{}'::jsonb,
  answer_timestamps JSONB DEFAULT '[]'::jsonb,
  reached_results BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert sessions (anonymous users)
CREATE POLICY "Anyone can insert quiz sessions"
ON public.quiz_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update sessions created within the last hour (for anonymous tracking)
CREATE POLICY "Anyone can update recent quiz sessions"
ON public.quiz_sessions
FOR UPDATE
USING (created_at > (now() - interval '1 hour'));

-- Allow anyone to view sessions (needed for analytics dashboard)
CREATE POLICY "Anyone can view quiz sessions"
ON public.quiz_sessions
FOR SELECT
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_quiz_sessions_updated_at
BEFORE UPDATE ON public.quiz_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Also update quiz_responses RLS to allow anonymous updates within 1 hour
DROP POLICY IF EXISTS "Users can update their own quiz responses" ON public.quiz_responses;

CREATE POLICY "Users can update quiz responses"
ON public.quiz_responses
FOR UPDATE
USING (
  (user_id = auth.uid()) 
  OR (user_id IS NULL AND created_at > (now() - interval '1 hour'))
);