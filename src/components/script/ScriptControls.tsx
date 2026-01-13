import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Copy,
  Check,
  Maximize2,
  Volume2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import {
  TONE_OPTIONS,
  DURATION_OPTIONS,
  VIDEO_TYPE_OPTIONS,
} from "@/types/creatorProfile";

interface ScriptControlsProps {
  onRegenerate: () => void;
  onAdjustTone: (tone: string) => void;
  onAdjustDuration: (duration: string) => void;
  onAdjustFormat: (format: string) => void;
  onCopy: () => void;
  onTeleprompter: () => void;
  isGenerating: boolean;
  currentTone: string;
  currentDuration: string;
  currentFormat: string;
  scriptText: string;
}

export function ScriptControls({
  onRegenerate,
  onAdjustTone,
  onAdjustDuration,
  onAdjustFormat,
  onCopy,
  onTeleprompter,
  isGenerating,
  currentTone,
  currentDuration,
  currentFormat,
  scriptText,
}: ScriptControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(scriptText);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Primary actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onRegenerate}
          disabled={isGenerating}
          variant="outline"
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          Regenerar
        </Button>

        <Button
          onClick={handleCopy}
          variant="outline"
          className="gap-2"
          disabled={!scriptText}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copiado!" : "Copiar"}
        </Button>

        <Button
          onClick={onTeleprompter}
          className="gap-2 ml-auto"
          disabled={!scriptText}
        >
          <Maximize2 className="w-4 h-4" />
          Teleprompter
        </Button>
      </div>

      {/* Adjustment controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/50">
        {/* Tone */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Volume2 className="w-4 h-4" />
            Tom
          </label>
          <Select value={currentTone} onValueChange={onAdjustTone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TONE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Clock className="w-4 h-4" />
            Dura\u00E7\u00E3o
          </label>
          <Select value={currentDuration} onValueChange={onAdjustDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Format */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            Formato
          </label>
          <Select value={currentFormat} onValueChange={onAdjustFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VIDEO_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
