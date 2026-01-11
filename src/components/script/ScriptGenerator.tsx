import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Newspaper } from "lucide-react";
import { CreatorProfile } from "@/types/creatorProfile";
import { ContextSummary } from "./ContextSummary";
import { ScriptOutput } from "./ScriptOutput";
import { ScriptControls } from "./ScriptControls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ScriptGeneratorProps {
  profile: CreatorProfile;
  onEditProfile: () => void;
  generatedScript: string;
  isGenerating: boolean;
  onGenerate: (newsContext?: string) => Promise<void>;
  onRegenerate: (adjustments: { tone?: string; duration?: string; format?: string }) => Promise<void>;
  onOpenTeleprompter: () => void;
  onScriptChange: (script: string) => void;
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

  const handleGenerate = async () => {
    await onGenerate(newsContext || undefined);
  };

  const handleRegenerate = async () => {
    await onRegenerate({
      tone: currentTone,
      duration: currentDuration,
      format: currentFormat,
    });
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

  return (
    <div className="space-y-6">
      {/* Context summary */}
      <ContextSummary profile={profile} onEditProfile={onEditProfile} />
      
      {/* Main generation area */}
      <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-6">
        {/* Topic/context input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Gerar roteiro</h2>
              <p className="text-sm text-muted-foreground">
                Sobre: {profile.main_topic || 'Defina um tema no seu perfil'}
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
    </div>
  );
}
