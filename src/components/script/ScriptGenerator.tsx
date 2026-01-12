import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Newspaper } from "lucide-react";
import { CreatorProfile } from "@/types/creatorProfile";
import { ContextSummary } from "./ContextSummary";
import { ScriptOutput } from "./ScriptOutput";
import { ScriptControls } from "./ScriptControls";
import { NewsGrid } from "./NewsGrid";
import { ScriptHistory } from "./ScriptHistory";
import { useUserNews, UserNewsItem } from "@/hooks/useUserNews";

interface ScriptGeneratorProps {
  profile: CreatorProfile;
  onEditProfile: () => void;
  generatedScript: string;
  isGenerating: boolean;
  onGenerate: (newsContext?: string, selectedNews?: UserNewsItem[], complementaryPrompt?: string) => Promise<void>;
  onRegenerate: (adjustments: { tone?: string; duration?: string; format?: string }) => Promise<void>;
  onOpenTeleprompter: () => void;
  onScriptChange: (script: string) => void;
}

interface ScriptHistoryItem {
  id: string;
  created_at: string;
  script_text: string;
  news_ids_json: unknown;
  parameters_json?: unknown;
}

export function ScriptGenerator({
  profile,
  onEditProfile,
  generatedScript,
  isGenerating,
  onGenerate,
  onRegenerate,
  onOpenTeleprompter,
  onScriptChange,
}: ScriptGeneratorProps) {
  const [complementaryPrompt, setComplementaryPrompt] = useState("");
  const [showComplementaryInput, setShowComplementaryInput] = useState(false);
  const [currentTone, setCurrentTone] = useState(profile.speaking_tone);
  const [currentDuration, setCurrentDuration] = useState(profile.target_duration);
  const [currentFormat, setCurrentFormat] = useState(profile.video_type);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const { newsItems, isLoading: isLoadingNews, error: newsError, fetchAndSaveNews, loadNews } = useUserNews();

  // Load existing news when component mounts
  useEffect(() => {
    if (profile.main_topic) {
      loadNews(profile.main_topic);
    }
  }, [profile.main_topic, loadNews]);

  // Check if we have news already
  useEffect(() => {
    if (newsItems.length > 0) {
      setHasStarted(true);
    }
  }, [newsItems]);

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
    // Get selected news items
    const selectedNews = newsItems.filter(n => selectedNewsIds.includes(n.id));
    
    await onGenerate(undefined, selectedNews, complementaryPrompt || undefined);
    // Refresh history after generating
    setHistoryRefreshTrigger((prev) => prev + 1);
  };

  const handleRegenerate = async () => {
    await onRegenerate({
      tone: currentTone,
      duration: currentDuration,
      format: currentFormat,
    });
    setHistoryRefreshTrigger((prev) => prev + 1);
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

  const handleSelectScript = (script: ScriptHistoryItem) => {
    if (currentScriptId === script.id) {
      // Deselect
      setCurrentScriptId(null);
      return;
    }
    
    setCurrentScriptId(script.id);
    onScriptChange(script.script_text);
    
    // Parse news IDs if available
    if (script.news_ids_json && Array.isArray(script.news_ids_json)) {
      setSelectedNewsIds(script.news_ids_json as string[]);
    }
  };

  const handleDeleteScript = (id: string) => {
    if (currentScriptId === id) {
      setCurrentScriptId(null);
      onScriptChange("");
    }
  };

  // Initial state - show "Start creating" button
  if (!hasStarted) {
    return (
      <div className="space-y-6">
        <ContextSummary profile={profile} onEditProfile={onEditProfile} />
        
        <div className="rounded-2xl border bg-card p-8 md:p-12 text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Pronto para criar?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Vamos buscar as notícias mais recentes sobre <strong>{profile.main_topic || "seu tema"}</strong> para você selecionar e criar seu roteiro.
            </p>
          </div>
          
          <Button
            onClick={handleStartCreating}
            disabled={isLoadingNews || !profile.main_topic}
            size="lg"
            className="gap-3 h-14 text-lg font-medium px-8"
          >
            {isLoadingNews ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Buscando notícias...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Começar a criar
              </>
            )}
          </Button>
          
          {newsError && (
            <p className="text-destructive text-sm">{newsError}</p>
          )}
        </div>
        
        {/* Script History - always visible */}
        <ScriptHistory
          currentScriptId={currentScriptId}
          onSelectScript={handleSelectScript}
          onDeleteScript={handleDeleteScript}
          refreshTrigger={historyRefreshTrigger}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context summary */}
      <ContextSummary profile={profile} onEditProfile={onEditProfile} />
      
      {/* News Grid - populated from database */}
      <NewsGrid
        newsItems={newsItems}
        isLoading={isLoadingNews}
        error={newsError}
        selectedIds={selectedNewsIds}
        onSelectionChange={setSelectedNewsIds}
        onRefresh={handleRefreshNews}
      />
      
      {/* Main generation area */}
      <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-6">
        {/* Topic/context input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Gerar roteiro</h2>
              <p className="text-sm text-muted-foreground">
                Sobre: {profile.main_topic || 'Defina um tema no seu perfil'}
                {selectedNewsIds.length > 0 && (
                  <span className="ml-2 text-primary">
                    • {selectedNewsIds.length} notícia(s) selecionada(s)
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComplementaryInput(!showComplementaryInput)}
              className="gap-2"
            >
              <Newspaper className="w-4 h-4" />
              {showComplementaryInput ? 'Ocultar prompt' : 'Prompt complementar'}
            </Button>
          </div>
          
          {showComplementaryInput && (
            <div className="space-y-2 animate-in">
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
          )}
        </div>
        
        {/* Generate button */}
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
      </div>
      
      {/* Script output */}
      <ScriptOutput 
        script={generatedScript} 
        isLoading={isGenerating}
        onEdit={onScriptChange}
      />
      
      {/* Controls (shown when script exists) */}
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
      
      {/* Script History */}
      <ScriptHistory
        currentScriptId={currentScriptId}
        onSelectScript={handleSelectScript}
        onDeleteScript={handleDeleteScript}
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
}
