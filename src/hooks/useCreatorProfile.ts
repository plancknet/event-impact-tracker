import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreatorProfile, DEFAULT_CREATOR_PROFILE } from "@/types/creatorProfile";

export function useCreatorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile>(DEFAULT_CREATOR_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setProfile({
          ...DEFAULT_CREATOR_PROFILE,
          ...data,
          // These fields don't exist in DB, use defaults
          audience_age_min: DEFAULT_CREATOR_PROFILE.audience_age_min,
          audience_age_max: DEFAULT_CREATOR_PROFILE.audience_age_max,
          audience_gender_split: DEFAULT_CREATOR_PROFILE.audience_gender_split,
          duration_unit: (data.duration_unit as "minutes" | "words") || DEFAULT_CREATOR_PROFILE.duration_unit,
        });
        setHasProfile(true);
      } else {
        setProfile(DEFAULT_CREATOR_PROFILE);
        setHasProfile(false);
      }
    } catch (err) {
      console.error("Failed to load creator profile:", err);
      setError("Não foi possível carregar o perfil.");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = async (updates: Partial<CreatorProfile>): Promise<boolean> => {
    if (!user) {
      setError("Você precisa estar logado.");
      return false;
    }

    try {
      setError(null);
      const profileData = { ...profile, ...updates };

      if (hasProfile) {
        const { error: updateError } = await supabase
          .from("creator_profiles")
          .update({
            display_name: profileData.display_name,
            main_topic: profileData.main_topic,
            expertise_level: profileData.expertise_level,
            audience_type: profileData.audience_type,
            video_type: profileData.video_type,
            target_duration: profileData.target_duration,
            duration_unit: profileData.duration_unit,
            platform: profileData.platform,
            speaking_tone: profileData.speaking_tone,
            energy_level: profileData.energy_level,
            content_goal: profileData.content_goal,
            script_language: profileData.script_language,
            news_language: profileData.news_language,
            include_cta: profileData.include_cta,
            cta_template: profileData.cta_template,
          })
          .eq("user_id", user.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("creator_profiles")
          .insert({
            user_id: user.id,
            display_name: profileData.display_name,
            main_topic: profileData.main_topic,
            expertise_level: profileData.expertise_level,
            audience_type: profileData.audience_type,
            video_type: profileData.video_type,
            target_duration: profileData.target_duration,
            duration_unit: profileData.duration_unit,
            platform: profileData.platform,
            speaking_tone: profileData.speaking_tone,
            energy_level: profileData.energy_level,
            content_goal: profileData.content_goal,
            script_language: profileData.script_language,
            news_language: profileData.news_language,
            include_cta: profileData.include_cta,
            cta_template: profileData.cta_template,
          });

        if (insertError) throw insertError;
        setHasProfile(true);
      }

      setProfile(profileData as CreatorProfile);
      return true;
    } catch (err) {
      console.error("Failed to save creator profile:", err);
      setError("Não foi possível salvar o perfil.");
      return false;
    }
  };

  const updateProfile = (updates: Partial<CreatorProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return {
    profile,
    isLoading,
    hasProfile,
    error,
    saveProfile,
    updateProfile,
    reloadProfile: loadProfile,
  };
}
