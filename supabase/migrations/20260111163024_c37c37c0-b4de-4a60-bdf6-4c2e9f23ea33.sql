-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create creator_profiles table for persistent user preferences
CREATE TABLE public.creator_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Creator identity
  display_name TEXT,
  main_topic TEXT NOT NULL DEFAULT 'Tecnologia',
  expertise_level TEXT NOT NULL DEFAULT 'intermediario',
  
  -- Audience profile
  audience_type TEXT NOT NULL DEFAULT 'publico_geral',
  audience_pain_points TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Video format
  video_type TEXT NOT NULL DEFAULT 'video_curto',
  target_duration TEXT NOT NULL DEFAULT '3',
  duration_unit TEXT NOT NULL DEFAULT 'minutes',
  platform TEXT NOT NULL DEFAULT 'YouTube',
  
  -- Speaking style
  speaking_tone TEXT NOT NULL DEFAULT 'conversacional',
  energy_level TEXT NOT NULL DEFAULT 'medio',
  
  -- Content goal
  content_goal TEXT NOT NULL DEFAULT 'informar',
  
  -- Script preferences
  script_language TEXT NOT NULL DEFAULT 'Portuguese',
  news_language TEXT NOT NULL DEFAULT 'pt-BR',
  include_cta BOOLEAN NOT NULL DEFAULT true,
  cta_template TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
ON public.creator_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.creator_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON public.creator_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_creator_profiles_updated_at
BEFORE UPDATE ON public.creator_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();