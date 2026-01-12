-- Create table for storing fetched news items
CREATE TABLE public.user_news_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  link TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  source TEXT,
  summary TEXT,
  external_id TEXT,
  topic TEXT NOT NULL,
  language TEXT DEFAULT 'pt-BR',
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_user_news_items_user_topic ON public.user_news_items(user_id, topic);
CREATE INDEX idx_user_news_items_fetched ON public.user_news_items(user_id, fetched_at DESC);

-- Enable Row Level Security
ALTER TABLE public.user_news_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own news items"
ON public.user_news_items
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own news items"
ON public.user_news_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own news items"
ON public.user_news_items
FOR DELETE
USING (auth.uid() = user_id);