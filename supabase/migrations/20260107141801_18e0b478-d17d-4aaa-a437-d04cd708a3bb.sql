-- Add is_duplicate column to alert_news_results
ALTER TABLE public.alert_news_results 
ADD COLUMN IF NOT EXISTS is_duplicate boolean NOT NULL DEFAULT false;

-- Create full_news_content table
CREATE TABLE public.full_news_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  news_id uuid NOT NULL REFERENCES public.alert_news_results(id) ON DELETE CASCADE,
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'pending',
  content_full text,
  CONSTRAINT status_check CHECK (status IN ('pending', 'success', 'error'))
);

-- Enable RLS
ALTER TABLE public.full_news_content ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read on full_news_content" 
ON public.full_news_content FOR SELECT USING (true);

CREATE POLICY "Allow public insert on full_news_content" 
ON public.full_news_content FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on full_news_content" 
ON public.full_news_content FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on full_news_content" 
ON public.full_news_content FOR DELETE USING (true);

-- Create index for faster lookups
CREATE INDEX idx_full_news_content_news_id ON public.full_news_content(news_id);