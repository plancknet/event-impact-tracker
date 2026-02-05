-- Add missing column for gender question
ALTER TABLE public.quiz_responses 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS gender_at timestamp with time zone;

-- Remove unused columns that don't match quiz questions
ALTER TABLE public.quiz_responses 
DROP COLUMN IF EXISTS result_goal,
DROP COLUMN IF EXISTS result_goal_at,
DROP COLUMN IF EXISTS publish_frequency,
DROP COLUMN IF EXISTS publish_frequency_at;

-- Drop the quiz_sessions table (no longer needed - consolidated into quiz_responses)
DROP TABLE IF EXISTS public.quiz_sessions;