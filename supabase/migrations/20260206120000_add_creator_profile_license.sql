ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS has_license BOOLEAN NOT NULL DEFAULT false;
