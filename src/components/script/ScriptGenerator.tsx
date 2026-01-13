import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles } from "lucide-react";
import { CreatorProfile } from "@/types/creatorProfile";
import { ContextSummary } from "./ContextSummary";
import { ScriptOutput } from "./ScriptOutput";
import { ScriptControls } from "./ScriptControls";
import { NewsGrid } from "./NewsGrid";
import { ScriptHistory } from "./ScriptHistory";
import { useUserNews, UserNewsItem } from "@/hooks/useUserNews";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface ScriptGeneratorProps {
  profile: CreatorProfile;
  onEditProfile: () => void;
  onApplyProfile: (updates: Partial<CreatorProfile>) => void;
  generatedScript: string;
  isGenerating: boolean;
  onGenerate: (
    newsContext?: string,
    selectedNews?: UserNewsItem[],
    complementaryPrompt?: string,
  ) => Promise<{ scriptId?: string } | void>;
  onRegenerate: (adjustments: { tone?: string; duration?: string; format?: string }) => Promise<{ scriptId?: string } | void>;
  onOpenTeleprompter: () => void;
  onScriptChange: (script: string) => void;
  resetTrigger: number;
  historyExpandTrigger: number;
  autoFetchTrigger: number;
}

interface ScriptHistoryItem {
  id: string;
  created_at: string;
  script_text: string;
  news_ids_json: unknown;
  parameters_json?: unknown;
}

type ScriptParameters = {
  tone?: string;
  audience?: string;
  language?: string;
  duration?: string;
  durationUnit?: string;
  scriptType?: string;
  includeCta?: boolean;
  ctaText?: string;
  audienceAgeMin?: number;
  audienceAgeMax?: number;
  audienceGenderSplit?: number;
  complementaryPrompt?: string;
  profile?: {
    mainSubject?: string;
    goal?: string;
    platform?: string;
  };
};

const parseScriptParameters = (value: unknown): ScriptParameters | null => {
  if (!value || typeof value !== "object") return null;
  return value as ScriptParameters;
};

export function ScriptGenerator({
  profile,
  onEditProfile,
  onApplyProfile,
  generatedScript,
  isGenerating,
  onGenerate,
  onRegenerate,
  onOpenTeleprompter,
  onScriptChange,
  resetTrigger,
  historyExpandTrigger,
  autoFetchTrigger,
}: ScriptGeneratorProps) {
  const { user } = useAuth();
  const [complementaryPrompt, setComplementaryPrompt] = useState("");
  const [currentTone, setCurrentTone] = useState(profile.speaking_tone);
  const [currentDuration, setCurrentDuration] = useState(profile.target_duration);
  const [currentFormat, setCurrentFormat] = useState(profile.video_type);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const outputRef = useRef<HTMLDivElement | null>(null);

  const {
    newsItems,
    isLoading: isLoadingNews,
    error: newsError,
    fetchAndSaveNews,
    loadNews,
    clearNews,
  } = useUserNews();

  // Load existing news when component mounts
  useEffect(() => {
    if (profile.main_topic) {
      loadNews(profile.main_topic);
    }
  }, [profile.main_topic, loadNews]);

  useEffect(() => {
    setComplementaryPrompt("");
    setSelectedNewsIds([]);
    setCurrentScriptId(null);
    setHasStarted(false);
    setCurrentTone(profile.speaking_tone);
    setCurrentDuration(profile.target_duration);
    setCurrentFormat(profile.video_type);
    setSaveError(null);
    setSaveSuccess(null);
    onScriptChange("");
    clearNews();
  }, [resetTrigger, onScriptChange, clearNews, profile.speaking_tone, profile.target_duration, profile.video_type]);

  useEffect(() => {
    if (autoFetchTrigger <= 0) return;
    if (!profile.main_topic.trim()) return;
    setHasStarted(true);
    fetchAndSaveNews(profile.main_topic, profile.news_language);
  }, [autoFetchTrigger, fetchAndSaveNews, profile.main_topic, profile.news_language]);

  useEffect(() => {
    if (scrollTrigger <= 0) return;
    const timeout = window.setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [scrollTrigger]);

  const handleStartCreating = async () => {
    if (!profile.main_topic.trim()) return;

    setHasStarted(true);
    await fetchAndSaveNews(profile.main_topic, profile.news_language);
  };

  const handleRefreshNews = async () => {
    if (!profile.main_topic.trim()) return;
    await fetchAndSaveNews(profile.main_topic, profile.news_language);
  };

  const handleGenerate = async () => {
    const selectedNews = newsItems.filter((n) => selectedNewsIds.includes(n.id));

    const result = await onGenerate(undefined, selectedNews, complementaryPrompt || undefined);
    if (result && typeof result === "object" && "scriptId" in result && result.scriptId) {
      setCurrentScriptId(result.scriptId);
    }
    setHistoryRefreshTrigger((prev) => prev + 1);
    setScrollTrigger((prev) => prev + 1);
  };

  const handleRegenerate = async () => {
    const result = await onRegenerate({
      tone: currentTone,
      duration: currentDuration,
      format: currentFormat,
    });
    if (result && typeof result === "object" && "scriptId" in result && result.scriptId) {
      setCurrentScriptId(result.scriptId);
    }
    setHistoryRefreshTrigger((prev) => prev + 1);
    setScrollTrigger((prev) => prev + 1);
  };

  const handleAdjustTone = (tone: string) => {
    setCurrentTone(tone);
  };

  const handleAdjustDuration = (duration: string) => {
    setCurrentDuration(duration);
  };

  const handleAdjustFormat = (format: string) => {
    setCurrentFormat(format);
  };

  const buildParametersForStorage = (): ScriptParameters => ({
    tone: currentTone,
    audience: profile.audience_type,
    language: profile.script_language,
    duration: currentDuration,
    durationUnit: profile.duration_unit,
    scriptType: currentFormat,
    includeCta: profile.include_cta,
    ctaText: profile.cta_template,
    audienceAgeMin: profile.audience_age_min,
    audienceAgeMax: profile.audience_age_max,
    audienceGenderSplit: profile.audience_gender_split,
    complementaryPrompt: complementaryPrompt.trim() || undefined,
    profile: {
      mainSubject: profile.main_topic,
      goal: profile.content_goal,
      platform: profile.platform,
    },
  });

  const handleSaveScript = async () => {
    if (!generatedScript.trim()) return;
    if (!user) {
      setSaveError("Você precisa estar logado para salvar.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      if (currentScriptId) {
        const { error } = await supabase
          .from("teleprompter_scripts")
          .update({
            script_text: generatedScript,
            news_ids_json: selectedNewsIds,
            parameters_json: buildParametersForStorage(),
          })
          .eq("id", currentScriptId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("teleprompter_scripts")
          .insert({
            user_id: user.id,
            script_text: generatedScript,
            news_ids_json: selectedNewsIds,
            parameters_json: buildParametersForStorage(),
          })
          .select("id")
          .single();

        if (error) throw error;
        if (data?.id) {
          setCurrentScriptId(data.id);
        }
      }

      setHistoryRefreshTrigger((prev) => prev + 1);
      setSaveSuccess("Roteiro salvo.");
    } catch (err) {
      console.error("Failed to save script:", err);
      setSaveError("Não foi possível salvar o roteiro.");
    } finally {
      setIsSaving(false);
    }
  };

  const applyParametersToProfile = (params: ScriptParameters | null) => {
    if (!params) return;

    const updates: Partial<CreatorProfile> = {};

    if (typeof params.audience === "string") updates.audience_type = params.audience;
    if (typeof params.duration === "string") updates.target_duration = params.duration;
    if (params.durationUnit === "minutes" || params.durationUnit === "words") {
      updates.duration_unit = params.durationUnit;
    }
    if (typeof params.scriptType === "string") updates.video_type = params.scriptType;
    if (typeof params.tone === "string") updates.speaking_tone = params.tone;
    if (typeof params.language === "string") updates.script_language = params.language;
    if (typeof params.includeCta === "boolean") updates.include_cta = params.includeCta;
    if (typeof params.ctaText === "string") updates.cta_template = params.ctaText;
    if (typeof params.audienceAgeMin === "number") updates.audience_age_min = params.audienceAgeMin;
    if (typeof params.audienceAgeMax === "number") updates.audience_age_max = params.audienceAgeMax;
    if (typeof params.audienceGenderSplit === "number") updates.audience_gender_split = params.audienceGenderSplit;

    if (params.profile) {
      if (typeof params.profile.mainSubject === "string") updates.main_topic = params.profile.mainSubject;
      if (typeof params.profile.goal === "string") updates.content_goal = params.profile.goal;
      if (typeof params.profile.platform === "string") updates.platform = params.profile.platform;
    }

    if (Object.keys(updates).length > 0) {
      onApplyProfile(updates);
    }

    if (typeof params.profile?.mainSubject === "string") {
      loadNews(params.profile.mainSubject);
    }
  };

  const handleSelectScript = (script: ScriptHistoryItem) => {
    if (currentScriptId === script.id) {
      setCurrentScriptId(null);
      return;
    }

    setCurrentScriptId(script.id);
    onScriptChange(script.script_text);
    setHasStarted(true);
    setSaveError(null);
    setSaveSuccess(null);

    if (script.news_ids_json && Array.isArray(script.news_ids_json)) {
      setSelectedNewsIds(script.news_ids_json as string[]);
    } else {
      setSelectedNewsIds([]);
    }

    const params = parseScriptParameters(script.parameters_json);
    if (params?.tone) setCurrentTone(params.tone);
    if (params?.duration) setCurrentDuration(params.duration);
    if (params?.scriptType) setCurrentFormat(params.scriptType);
    setComplementaryPrompt(typeof params?.complementaryPrompt === "string" ? params.complementaryPrompt : "");

    applyParametersToProfile(params);
  };

  const handleDeleteScript = (id: string) => {
    if (currentScriptId === id) {
      setCurrentScriptId(null);
      onScriptChange("");
    }
  };

  return (
    <div className="space-y-6">
      <ScriptHistory
        currentScriptId={currentScriptId}
        onSelectScript={handleSelectScript}
        onDeleteScript={handleDeleteScript}
        refreshTrigger={historyRefreshTrigger}
        expandTrigger={historyExpandTrigger || undefined}
      />

      <ContextSummary profile={profile} onEditProfile={onEditProfile} />

      <NewsGrid
        newsItems={newsItems}
        isLoading={isLoadingNews}
        error={newsError}
        selectedIds={selectedNewsIds}
        onSelectionChange={setSelectedNewsIds}
        onRefresh={hasStarted ? handleRefreshNews : handleStartCreating}
      />

      <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Gerar roteiro</h2>
          <p className="text-sm text-muted-foreground">
            Sobre: {profile.main_topic || "Defina um tema no seu perfil"}
            {selectedNewsIds.length > 0 && (
              <span className="ml-2 text-primary">
                ({selectedNewsIds.length} notícia(s) selecionada(s))
              </span>
            )}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="complementaryPrompt">Prompt complementar</Label>
          <Textarea
            id="complementaryPrompt"
            value={complementaryPrompt}
            onChange={(e) => setComplementaryPrompt(e.target.value)}
            placeholder="Adicione instruções específicas para personalizar o roteiro, ex: 'Foque nos aspectos de segurança' ou 'Use um tom mais crítico'..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Opcional: instruções adicionais para guiar a geração do roteiro
          </p>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating || !profile.main_topic || (selectedNewsIds.length === 0 && !complementaryPrompt.trim())}
        size="lg"
        className="w-full gap-3 h-14 text-lg font-medium"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Gerando roteiro...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Gerar Roteiro
          </>
        )}
      </Button>

      {selectedNewsIds.length === 0 && !complementaryPrompt.trim() && (
        <p className="text-sm text-muted-foreground text-center">
          Selecione pelo menos uma notícia ou adicione um prompt complementar
        </p>
      )}

      <div ref={outputRef}>
        <ScriptOutput
          script={generatedScript}
          isLoading={isGenerating}
          onEdit={onScriptChange}
        />
      </div>

      {generatedScript && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {saveError && <span className="text-destructive">{saveError}</span>}
            {saveSuccess && <span className="text-primary">{saveSuccess}</span>}
          </div>
          <Button onClick={handleSaveScript} disabled={isSaving || !generatedScript.trim()}>
            {isSaving ? "Salvando..." : "Salvar roteiro"}
          </Button>
        </div>
      )}

      {generatedScript && !isGenerating && (
        <ScriptControls
          onRegenerate={handleRegenerate}
          onAdjustTone={handleAdjustTone}
          onAdjustDuration={handleAdjustDuration}
          onAdjustFormat={handleAdjustFormat}
          onCopy={() => {}}
          onTeleprompter={onOpenTeleprompter}
          isGenerating={isGenerating}
          currentTone={currentTone}
          currentDuration={currentDuration}
          currentFormat={currentFormat}
          scriptText={generatedScript}
        />
      )}
    </div>
  );
}
