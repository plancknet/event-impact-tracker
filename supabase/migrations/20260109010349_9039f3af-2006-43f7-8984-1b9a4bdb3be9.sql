-- Add missing columns to search_terms table
ALTER TABLE public.search_terms 
ADD COLUMN IF NOT EXISTS main_area text,
ADD COLUMN IF NOT EXISTS collection_date date;