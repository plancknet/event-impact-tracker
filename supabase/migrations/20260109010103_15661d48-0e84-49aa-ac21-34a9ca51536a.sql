-- Migration: add_thinkandtalk_news_fields
-- Add published_at column to alert_news_results if it doesn't exist

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'alert_news_results' 
        AND column_name = 'published_at'
    ) THEN
        ALTER TABLE public.alert_news_results ADD COLUMN published_at TIMESTAMPTZ;
    END IF;
END $$;