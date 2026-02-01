-- Add session tracking columns to quiz_responses
ALTER TABLE public.quiz_responses 
ADD COLUMN IF NOT EXISTS session_started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS answer_timestamps JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reached_results BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_started ON public.quiz_responses(session_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_reached_results ON public.quiz_responses(reached_results) WHERE reached_results = true;