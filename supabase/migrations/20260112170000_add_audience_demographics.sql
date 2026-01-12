ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS audience_age_min INTEGER NOT NULL DEFAULT 18;

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS audience_age_max INTEGER NOT NULL DEFAULT 45;

ALTER TABLE public.creator_profiles
  ADD COLUMN IF NOT EXISTS audience_gender_split INTEGER NOT NULL DEFAULT 50;

ALTER TABLE public.creator_profiles
  ADD CONSTRAINT creator_profiles_audience_age_min_chk
    CHECK (audience_age_min BETWEEN 0 AND 100);

ALTER TABLE public.creator_profiles
  ADD CONSTRAINT creator_profiles_audience_age_max_chk
    CHECK (audience_age_max BETWEEN 0 AND 100);

ALTER TABLE public.creator_profiles
  ADD CONSTRAINT creator_profiles_audience_gender_split_chk
    CHECK (audience_gender_split BETWEEN 0 AND 100);

ALTER TABLE public.creator_profiles
  ADD CONSTRAINT creator_profiles_audience_age_range_chk
    CHECK (audience_age_min <= audience_age_max);
