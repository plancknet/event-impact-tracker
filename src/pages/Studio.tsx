import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { ScriptGenerator } from "@/components/script/ScriptGenerator";
import { TeleprompterDisplay, DEFAULT_TELEPROMPTER_SETTINGS } from "@/components/teleprompter/TeleprompterDisplay";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { UserNewsItem } from "@/hooks/useUserNews";

export default function Studio() {
  const { user, signOut } = useAuth();
  const { profile, isLoading, hasProfile, saveProfile, updateProfile } = useCreatorProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);

  const handleCompleteOnboarding = async () => {
    const success = await saveProfile(profile);
    if (success) {
      setShowOnboarding(false);
    }
  };

  const handleGenerate = async (newsContext?: string, selectedNews?: UserNewsItem[], complementaryPrompt?: string) => {
    setIsGenerating(true);
    try {
      // Build news items for the edge function
      const newsItems = selectedNews?.map(n => ({
        id: n.id,
        title: n.title,
        summary: n.summary || undefined,
        content: n.summary || undefined, // Use summary as content since we don't have full content
      })) || [];

      const { data, error } = await supabase.functions.invoke('generate-teleprompter-script', {
        body: {
          newsItems,
          parameters: {
            tone: profile.speaking_tone,
            audience: profile.audience_type,
            audienceAgeMin: profile.audience_age_min,
            audienceAgeMax: profile.audience_age_max,
            audienceGenderSplit: profile.audience_gender_split,
            duration: profile.target_duration,
            durationUnit: profile.duration_unit,
            language: profile.script_language,
            scriptType: profile.video_type,
            includeCta: profile.include_cta,
            ctaText: profile.cta_template,
            profile: {
              mainSubject: profile.main_topic,
              goal: profile.content_goal,
              platform: profile.platform,
            },
          },
          complementaryPrompt: complementaryPrompt,
        },
      });
      if (error) throw error;
      setGeneratedScript(data.script || '');
    } catch (err) {
      console.error('Failed to generate script:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (adjustments: { tone?: string; duration?: string; format?: string }) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-teleprompter-script', {
        body: {
          newsItems: [],
          parameters: {
            tone: adjustments.tone || profile.speaking_tone,
            audience: profile.audience_type,
            audienceAgeMin: profile.audience_age_min,
            audienceAgeMax: profile.audience_age_max,
            audienceGenderSplit: profile.audience_gender_split,
            duration: adjustments.duration || profile.target_duration,
            durationUnit: profile.duration_unit,
            language: profile.script_language,
            scriptType: adjustments.format || profile.video_type,
            includeCta: profile.include_cta,
            ctaText: profile.cta_template,
            profile: {
              mainSubject: profile.main_topic,
              goal: profile.content_goal,
              platform: profile.platform,
            },
          },
          refinementPrompt: 'Regenere o roteiro mantendo o tema.',
          baseScript: generatedScript,
        },
      });
      if (error) throw error;
      setGeneratedScript(data.script || '');
    } catch (err) {
      console.error('Failed to regenerate script:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show onboarding for new users or when requested
  if (!hasProfile || showOnboarding) {
    return (
      <OnboardingFlow
        profile={profile}
        onChange={updateProfile}
        onComplete={handleCompleteOnboarding}
      />
    );
  }

  // Teleprompter fullscreen mode
  if (showTeleprompter && generatedScript) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <TeleprompterDisplay
          script={generatedScript}
          settings={DEFAULT_TELEPROMPTER_SETTINGS}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTeleprompter(false)}
          className="fixed top-4 right-4 text-white/70 hover:text-white z-50"
        >
          Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">ThinkAndTalk</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-4xl mx-auto px-4 py-8">
        <ScriptGenerator
          profile={profile}
          onEditProfile={() => setShowOnboarding(true)}
          generatedScript={generatedScript}
          isGenerating={isGenerating}
          onGenerate={handleGenerate}
          onRegenerate={handleRegenerate}
          onOpenTeleprompter={() => setShowTeleprompter(true)}
          onScriptChange={setGeneratedScript}
        />
      </main>
    </div>
  );
}
