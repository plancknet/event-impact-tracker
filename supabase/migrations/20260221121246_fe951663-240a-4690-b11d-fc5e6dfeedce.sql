
-- Add total_answers_count column
ALTER TABLE public.quiz_responses ADD COLUMN total_answers_count integer NOT NULL DEFAULT 0;

-- Create function to calculate total answers
CREATE OR REPLACE FUNCTION public.calculate_total_answers()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.total_answers_count := (
    CASE WHEN NEW.age_range IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.gender IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.main_goal IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.comfort_recording IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.biggest_challenge IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.planning_style IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.editing_time IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.niche IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.creator_level IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.audience_type IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.audience_age IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.audience_gender IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.video_format IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.video_duration IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.platforms IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.speaking_tone IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.energy_level IS NOT NULL THEN 1 ELSE 0 END +
    CASE WHEN NEW.content_goal IS NOT NULL THEN 1 ELSE 0 END
  );
  RETURN NEW;
END;
$function$;

-- Create trigger
CREATE TRIGGER trg_calculate_total_answers
BEFORE INSERT OR UPDATE ON public.quiz_responses
FOR EACH ROW
EXECUTE FUNCTION public.calculate_total_answers();

-- Backfill existing rows
UPDATE public.quiz_responses SET updated_at = now();
