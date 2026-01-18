-- Create table for quiz responses
CREATE TABLE public.quiz_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  age_range TEXT,
  main_goal TEXT,
  publish_frequency TEXT,
  comfort_recording TEXT,
  biggest_challenge TEXT,
  planning_style TEXT,
  editing_time TEXT,
  result_goal TEXT,
  niche TEXT,
  creator_level TEXT,
  audience_type TEXT,
  audience_age TEXT,
  audience_gender TEXT,
  video_format TEXT,
  video_duration TEXT,
  platforms TEXT[],
  speaking_tone TEXT,
  energy_level TEXT,
  content_goal TEXT,
  coupon_revealed BOOLEAN DEFAULT FALSE,
  coupon_code TEXT DEFAULT 'CREATOR40',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (for anonymous quiz takers)
CREATE POLICY "Anyone can insert quiz responses"
ON public.quiz_responses
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view their own responses (if logged in)
CREATE POLICY "Users can view their own quiz responses"
ON public.quiz_responses
FOR SELECT
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND email IS NOT NULL)
);

-- Policy: Users can update their own responses
CREATE POLICY "Users can update their own quiz responses"
ON public.quiz_responses
FOR UPDATE
USING (
  user_id = auth.uid() OR 
  (user_id IS NULL AND created_at > now() - interval '1 hour')
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_quiz_responses_updated_at
BEFORE UPDATE ON public.quiz_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();