-- Add new columns to full_news_content for better tracking
ALTER TABLE public.full_news_content 
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS final_url text,
ADD COLUMN IF NOT EXISTS error_message text,
ADD COLUMN IF NOT EXISTS extractor text DEFAULT 'simple';