
-- Drop unused checkout button columns and rename remaining ones
-- Old button 2 → new button 1, old button 5 → new button 2
ALTER TABLE public.quiz_responses ADD COLUMN IF NOT EXISTS checkout_button_1_at_new timestamptz;
ALTER TABLE public.quiz_responses ADD COLUMN IF NOT EXISTS checkout_button_2_at_new timestamptz;

UPDATE public.quiz_responses SET 
  checkout_button_1_at_new = checkout_button_2_at,
  checkout_button_2_at_new = checkout_button_5_at;

ALTER TABLE public.quiz_responses DROP COLUMN checkout_button_1_at;
ALTER TABLE public.quiz_responses DROP COLUMN checkout_button_2_at;
ALTER TABLE public.quiz_responses DROP COLUMN checkout_button_3_at;
ALTER TABLE public.quiz_responses DROP COLUMN checkout_button_4_at;
ALTER TABLE public.quiz_responses DROP COLUMN checkout_button_5_at;

ALTER TABLE public.quiz_responses RENAME COLUMN checkout_button_1_at_new TO checkout_button_1_at;
ALTER TABLE public.quiz_responses RENAME COLUMN checkout_button_2_at_new TO checkout_button_2_at;

-- Update the RPC function to only handle 2 checkout buttons
CREATE OR REPLACE FUNCTION public.update_quiz_response(
  _quiz_id uuid,
  _data jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _created_at timestamptz;
BEGIN
  SELECT created_at INTO _created_at 
  FROM quiz_responses 
  WHERE id = _quiz_id;
  
  IF _created_at IS NULL THEN
    RAISE EXCEPTION 'Quiz not found';
  END IF;
  
  IF _created_at < (now() - interval '30 minutes') THEN
    RAISE EXCEPTION 'Quiz session expired';
  END IF;

  UPDATE quiz_responses
  SET
    age_range = COALESCE((_data->>'age_range'), age_range),
    age_range_at = COALESCE((_data->>'age_range_at')::timestamptz, age_range_at),
    gender = COALESCE((_data->>'gender'), gender),
    gender_at = COALESCE((_data->>'gender_at')::timestamptz, gender_at),
    main_goal = COALESCE((_data->>'main_goal'), main_goal),
    main_goal_at = COALESCE((_data->>'main_goal_at')::timestamptz, main_goal_at),
    comfort_recording = COALESCE((_data->>'comfort_recording'), comfort_recording),
    comfort_recording_at = COALESCE((_data->>'comfort_recording_at')::timestamptz, comfort_recording_at),
    biggest_challenge = COALESCE((_data->>'biggest_challenge'), biggest_challenge),
    biggest_challenge_at = COALESCE((_data->>'biggest_challenge_at')::timestamptz, biggest_challenge_at),
    planning_style = COALESCE((_data->>'planning_style'), planning_style),
    planning_style_at = COALESCE((_data->>'planning_style_at')::timestamptz, planning_style_at),
    editing_time = COALESCE((_data->>'editing_time'), editing_time),
    editing_time_at = COALESCE((_data->>'editing_time_at')::timestamptz, editing_time_at),
    niche = COALESCE((_data->>'niche'), niche),
    niche_at = COALESCE((_data->>'niche_at')::timestamptz, niche_at),
    creator_level = COALESCE((_data->>'creator_level'), creator_level),
    creator_level_at = COALESCE((_data->>'creator_level_at')::timestamptz, creator_level_at),
    audience_type = COALESCE((_data->>'audience_type'), audience_type),
    audience_type_at = COALESCE((_data->>'audience_type_at')::timestamptz, audience_type_at),
    audience_age = COALESCE((_data->>'audience_age'), audience_age),
    audience_age_at = COALESCE((_data->>'audience_age_at')::timestamptz, audience_age_at),
    audience_gender = COALESCE((_data->>'audience_gender'), audience_gender),
    audience_gender_at = COALESCE((_data->>'audience_gender_at')::timestamptz, audience_gender_at),
    video_format = COALESCE((_data->>'video_format'), video_format),
    video_format_at = COALESCE((_data->>'video_format_at')::timestamptz, video_format_at),
    video_duration = COALESCE((_data->>'video_duration'), video_duration),
    video_duration_at = COALESCE((_data->>'video_duration_at')::timestamptz, video_duration_at),
    platforms = CASE WHEN _data ? 'platforms' THEN ARRAY(SELECT jsonb_array_elements_text(_data->'platforms')) ELSE platforms END,
    platforms_at = COALESCE((_data->>'platforms_at')::timestamptz, platforms_at),
    speaking_tone = COALESCE((_data->>'speaking_tone'), speaking_tone),
    speaking_tone_at = COALESCE((_data->>'speaking_tone_at')::timestamptz, speaking_tone_at),
    energy_level = COALESCE((_data->>'energy_level'), energy_level),
    energy_level_at = COALESCE((_data->>'energy_level_at')::timestamptz, energy_level_at),
    content_goal = COALESCE((_data->>'content_goal'), content_goal),
    content_goal_at = COALESCE((_data->>'content_goal_at')::timestamptz, content_goal_at),
    transition_complete_at = COALESCE((_data->>'transition_complete_at')::timestamptz, transition_complete_at),
    coupon_revealed = COALESCE((_data->>'coupon_revealed')::boolean, coupon_revealed),
    coupon_revealed_at = COALESCE((_data->>'coupon_revealed_at')::timestamptz, coupon_revealed_at),
    email = COALESCE((_data->>'email'), email),
    completed_at = COALESCE((_data->>'completed_at')::timestamptz, completed_at),
    reached_results = COALESCE((_data->>'reached_results')::boolean, reached_results),
    sales_page_at = COALESCE((_data->>'sales_page_at')::timestamptz, sales_page_at),
    checkout_button_1_at = COALESCE((_data->>'checkout_button_1_at')::timestamptz, checkout_button_1_at),
    checkout_button_2_at = COALESCE((_data->>'checkout_button_2_at')::timestamptz, checkout_button_2_at),
    updated_at = now()
  WHERE id = _quiz_id;
END;
$$;
