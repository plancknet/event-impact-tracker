import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCreatorProfile } from "@/hooks/useCreatorProfile";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { ScriptGenerator } from "@/components/script/ScriptGenerator";
import { TeleprompterDisplay, DEFAULT_TELEPROMPTER_SETTINGS } from "@/components/teleprompter/TeleprompterDisplay";
import { Button } from "@/components/ui/button";
import { LogOut, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { UserNewsItem } from "@/hooks/useUserNews";
import type { CreatorProfile } from "@/types/creatorProfile";

type PendingGeneration = {
  profile: CreatorProfile;
  selectedNews: UserNewsItem[];
  selectedNewsIds: string[];
  complementaryPrompt?: string;
};

export default function Studio() {
  const { signOut, user } = useAuth();
  const { profile, isLoading, saveProfile, updateProfile } = useCreatorProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [historyExpandTrigger, setHistoryExpandTrigger] = useState(0);
  const [autoFetchTrigger, setAutoFetchTrigger] = useState(0);
  const [pendingGeneration, setPendingGeneration] = useState<PendingGeneration | null>(null);

  useEffect(() => {
    if (!user) {
      sessionStorage.setItem("draftCreatorProfile", JSON.stringify(profile));
    }
  }, [profile, user]);

  const handleStepChange = (step: number) => {
    if (step === 6) {
      setShowOnboarding(false);
      setOnboardingStep(6);
      return;
    }
    setShowOnboarding(true);
    setOnboardingStep(step);
  };

  const handleViewScripts = () => {
    setHistoryExpandTrigger((prev) => prev + 1);
    handleStepChange(6);
  };

  const handleNewScript = () => {
    updateProfile({ main_topic: "" });
    setGeneratedScript("");
    setResetTrigger((prev) => prev + 1);
    handleStepChange(1);
  };

  const handleCompleteOnboarding = async () => {
    if (!user) {
      setAutoFetchTrigger((prev) => prev + 1);
      handleStepChange(6);
      return;
    }
    const success = await saveProfile(profile);
    if (success) {
      setAutoFetchTrigger((prev) => prev + 1);
      handleStepChange(6);
    }
  };

  const handleGenerate = async (
    newsContext?: string,
    selectedNews?: UserNewsItem[],
    complementaryPrompt?: string,
    profileOverride?: CreatorProfile,
  ): Promise<{ scriptId?: string } | void> => {
    if (!user) {
      const payload: PendingGeneration = {
        profile: profileOverride || profile,
        selectedNews: selectedNews || [],
        selectedNewsIds: selectedNews?.map((item) => item.id) || [],
        complementaryPrompt,
      };
      sessionStorage.setItem("pendingScriptGeneration", JSON.stringify(payload));
      navigate("/auth?mode=signup&redirect=/?resume=1");
      return;
    }

    setIsGenerating(true);
    try {
      // Build news items for the edge function
      const newsItems = selectedNews?.map((n) => ({
        id: n.id,
        title: n.title,
        summary: n.summary || undefined,
        content: n.summary || undefined, // Use summary as content since we don't have full content
      })) || [];
      const effectiveProfile = profileOverride || profile;

      const { data, error } = await supabase.functions.invoke("generate-teleprompter-script", {
        body: {
          newsItems,
          parameters: {
            tone: effectiveProfile.speaking_tone,
            audience: effectiveProfile.audience_type,
            audienceAgeMin: effectiveProfile.audience_age_min,
            audienceAgeMax: effectiveProfile.audience_age_max,
            audienceGenderSplit: effectiveProfile.audience_gender_split,
            duration: effectiveProfile.target_duration,
            durationUnit: effectiveProfile.duration_unit,
            language: effectiveProfile.script_language,
            scriptType: effectiveProfile.video_type,
            includeCta: effectiveProfile.include_cta,
            ctaText: effectiveProfile.cta_template,
            profile: {
              mainSubject: effectiveProfile.main_topic,
              goal: effectiveProfile.content_goal,
              platform: effectiveProfile.platform,
            },
          },
          complementaryPrompt: complementaryPrompt,
        },
      });
      if (error) throw error;
      setGeneratedScript(data.script || "");
      return { scriptId: data.scriptId };
    } catch (err) {
      console.error("Failed to generate script:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (adjustments: { tone?: string; duration?: string; format?: string }): Promise<{ scriptId?: string } | void> => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-teleprompter-script", {
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
          refinementPrompt: "Regenere o roteiro mantendo o tema.",
          baseScript: generatedScript,
        },
      });
      if (error) throw error;
      setGeneratedScript(data.script || "");
      return { scriptId: data.scriptId };
    } catch (err) {
      console.error("Failed to regenerate script:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("resume") !== "1") return;
    // Wait for user to be authenticated before resuming
    if (!user) return;
    const raw = sessionStorage.getItem("pendingScriptGeneration");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PendingGeneration;
      // Save profile from pending generation to DB before proceeding
      saveProfile(parsed.profile).then(() => {
        setPendingGeneration(parsed);
        setShowOnboarding(false);
        setOnboardingStep(6);
      });
    } catch (err) {
      console.error("Failed to parse pending generation:", err);
    }
  }, [location.search, user, saveProfile]);

  const handlePendingGenerationHandled = () => {
    sessionStorage.removeItem("pendingScriptGeneration");
    setPendingGeneration(null);
    const params = new URLSearchParams(location.search);
    if (params.get("resume") === "1") {
      params.delete("resume");
      navigate({ pathname: "/", search: params.toString() }, { replace: true });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Teleprompter fullscreen mode
  if (showTeleprompter && generatedScript) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <TeleprompterDisplay
          script={generatedScript}
          settings={DEFAULT_TELEPROMPTER_SETTINGS}
          onBack={() => setShowTeleprompter(false)}
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
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">ThinkAndTalk</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Bem-vindo, {user?.email ?? "Visitante"}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handleNewScript}>
              Novo roteiro
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewScripts}>
              Meus Roteiros
            </Button>
            <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 whitespace-nowrap">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-6xl mx-auto px-4 py-8">
        <div className="md:hidden sticky top-[72px] z-30 bg-background/95 backdrop-blur border-b mb-6">
          <div className="py-3">
            <OnboardingProgress
              currentStep={onboardingStep}
              totalSteps={6}
              stepLabels={["Você", "Público", "Formato", "Estilo", "Notícias", "Roteiros"]}
              onStepChange={handleStepChange}
              orientation="horizontal"
            />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[220px_1fr]">
          <aside className="md:pt-4 hidden md:block">
            <OnboardingProgress
              currentStep={onboardingStep}
              totalSteps={6}
              stepLabels={["Você", "Público", "Formato", "Estilo", "Notícias", "Roteiros"]}
              onStepChange={handleStepChange}
              orientation="vertical"
            />
          </aside>

          <section className="min-w-0">
            {showOnboarding ? (
              <OnboardingFlow
                profile={profile}
                onChange={updateProfile}
                currentStep={onboardingStep}
                onStepChange={setOnboardingStep}
                onComplete={handleCompleteOnboarding}
              />
            ) : (
              <ScriptGenerator
                profile={profile}
                onEditProfile={() => handleStepChange(1)}
                onApplyProfile={updateProfile}
                generatedScript={generatedScript}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                onRegenerate={handleRegenerate}
                onOpenTeleprompter={() => setShowTeleprompter(true)}
                onScriptChange={setGeneratedScript}
                resetTrigger={resetTrigger}
                historyExpandTrigger={historyExpandTrigger}
                autoFetchTrigger={autoFetchTrigger}
                pendingGeneration={pendingGeneration}
                onPendingGenerationHandled={handlePendingGenerationHandled}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
