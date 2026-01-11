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
import { supabase } from "@/integrations/supabase/client";
import type { FullArticle } from "@/news/types";

interface ScriptGeneratorProps {
  profile: CreatorProfile;
  onEditProfile: () => void;
  generatedScript: string;
  isGenerating: boolean;
  onGenerate: (newsContext?: string, selectedNewsIds?: string[]) => Promise<void>;
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
  const [newsContext, setNewsContext] = useState("");
  const [showNewsInput, setShowNewsInput] = useState(false);
  const [currentTone, setCurrentTone] = useState(profile.speaking_tone);
  const [currentDuration, setCurrentDuration] = useState(profile.target_duration);
  const [currentFormat, setCurrentFormat] = useState(profile.video_type);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [currentScriptId, setCurrentScriptId] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const handleGenerate = async () => {
    await onGenerate(newsContext || undefined, selectedNewsIds);
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

  return (
    <div className="space-y-6">
      {/* Context summary */}
      <ContextSummary profile={profile} onEditProfile={onEditProfile} />
      
      {/* News Grid */}
      <NewsGrid
        topic={profile.main_topic}
        language={profile.news_language}
        selectedIds={selectedNewsIds}
        onSelectionChange={setSelectedNewsIds}
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
              onClick={() => setShowNewsInput(!showNewsInput)}
              className="gap-2"
            >
              <Newspaper className="w-4 h-4" />
              {showNewsInput ? 'Ocultar contexto' : 'Adicionar contexto'}
            </Button>
          </div>
          
          {showNewsInput && (
            <div className="space-y-2 animate-in">
              <Label htmlFor="newsContext">Contexto adicional ou notícias</Label>
              <Textarea
                id="newsContext"
                value={newsContext}
                onChange={(e) => setNewsContext(e.target.value)}
                placeholder="Cole aqui notícias, dados ou contexto adicional para o roteiro..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Opcional: adicione informações que você quer incluir no roteiro
              </p>
            </div>
          )}
        </div>
        
        {/* Generate button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !profile.main_topic}
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
