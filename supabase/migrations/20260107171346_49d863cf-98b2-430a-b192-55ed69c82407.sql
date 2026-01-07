-- Create table for AI analysis results (Steps 6, 7, 9, 10)
CREATE TABLE public.news_ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id UUID NOT NULL REFERENCES public.alert_news_results(id) ON DELETE CASCADE,
  full_content_id UUID NOT NULL REFERENCES public.full_news_content(id) ON DELETE CASCADE,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ai_model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  summary TEXT,
  categories TEXT,
  region VARCHAR(100),
  impact_asset_class VARCHAR(100),
  impact_direction VARCHAR(20),
  confidence_score REAL,
  selected_for_model BOOLEAN NOT NULL DEFAULT true,
  model_variables_json TEXT,
  raw_ai_response TEXT
);

-- Enable Row Level Security
ALTER TABLE public.news_ai_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read on news_ai_analysis"
ON public.news_ai_analysis
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on news_ai_analysis"
ON public.news_ai_analysis
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update on news_ai_analysis"
ON public.news_ai_analysis
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete on news_ai_analysis"
ON public.news_ai_analysis
FOR DELETE
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_news_ai_analysis_news_id ON public.news_ai_analysis(news_id);
CREATE INDEX idx_news_ai_analysis_full_content_id ON public.news_ai_analysis(full_content_id);