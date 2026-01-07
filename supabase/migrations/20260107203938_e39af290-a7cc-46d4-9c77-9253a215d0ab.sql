-- Create teleprompter_scripts table
CREATE TABLE public.teleprompter_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  news_ids_json JSONB NOT NULL,
  parameters_json JSONB NOT NULL,
  script_text TEXT NOT NULL,
  raw_ai_response TEXT
);

-- Enable RLS (public access for now, no auth)
ALTER TABLE public.teleprompter_scripts ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (no auth in app)
CREATE POLICY "Allow all operations on teleprompter_scripts"
ON public.teleprompter_scripts
FOR ALL
USING (true)
WITH CHECK (true);