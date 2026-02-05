-- Add timestamp columns for each quiz answer field
ALTER TABLE public.quiz_responses
ADD COLUMN IF NOT EXISTS age_range_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS main_goal_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS publish_frequency_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS comfort_recording_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS biggest_challenge_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS planning_style_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS editing_time_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS result_goal_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS niche_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS creator_level_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS audience_type_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS audience_age_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS audience_gender_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS video_format_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS video_duration_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS platforms_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS speaking_tone_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS energy_level_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS content_goal_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS coupon_revealed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS transition_complete_at timestamp with time zone;

-- Drop the JSON columns that are no longer needed
ALTER TABLE public.quiz_responses
DROP COLUMN IF EXISTS answer_timestamps,
DROP COLUMN IF EXISTS device_info;