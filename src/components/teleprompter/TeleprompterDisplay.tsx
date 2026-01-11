import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
} from "lucide-react";

interface TeleprompterDisplayProps {
  script: string;
  references?: { title: string; url?: string | null }[];
}

const DEFAULT_PAUSE_DURATIONS = {
  "pause-short": 1500,
  "pause-medium": 3500,
  "pause-long": 6000,
  "pause": 2500,
} as const;

type PauseType = keyof typeof DEFAULT_PAUSE_DURATIONS;

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "\"Times New Roman\", serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier", value: "\"Courier New\", monospace" },
];

export function TeleprompterDisplay({ script, references = [] }: TeleprompterDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [speed, setSpeed] = useState(50); // pixels per second
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPauseTags, setShowPauseTags] = useState(true);
  const [currentPause, setCurrentPause] = useState<string | null>(null);
  const [pauseDurations, setPauseDurations] = useState<Record<PauseType, number>>({
    ...DEFAULT_PAUSE_DURATIONS,
  });
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[0].value);
  const [fontSize, setFontSize] = useState(28);
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse script to identify pause positions
  const parseScript = useCallback((text: string) => {
    const pauseRegex = /<(pause-short|pause-medium|pause-long|pause|topic-change)>/g;
    const parts: { type: "text" | "pause" | "topic"; content: string; pauseType?: string }[] = [];
    let lastIndex = 0;
    let match;

    while ((match = pauseRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }
      if (match[1] === "topic-change") {
        parts.push({
          type: "topic",
          content: match[0],
        });
      } else {
        parts.push({
          type: "pause",
          content: match[0],
          pauseType: match[1],
        });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return parts;
  }, []);

  const parsedScript = parseScript(script);

  const handlePause = useCallback((pauseType: PauseType) => {
    setIsPaused(true);
    setCurrentPause(pauseType);
    
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      setCurrentPause(null);
    }, pauseDurations[pauseType]);
  }, [pauseDurations]);

  // Animate scrolling
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (containerRef.current && contentRef.current && !isPaused) {
      const pixelsPerMs = speed / 1000;
      scrollPositionRef.current += delta * pixelsPerMs;
      
      const maxScroll = contentRef.current.scrollHeight - containerRef.current.clientHeight;
      
      if (scrollPositionRef.current >= maxScroll) {
        scrollPositionRef.current = maxScroll;
        setIsPlaying(false);
      }
      
      containerRef.current.scrollTop = scrollPositionRef.current;

      // Check for pause markers in view
      const pauseElements = contentRef.current.querySelectorAll("[data-pause]");
      pauseElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const containerRect = containerRef.current!.getBoundingClientRect();
        const triggerPoint = containerRect.top + containerRect.height * 0.3;
        
        if (rect.top <= triggerPoint && rect.bottom >= triggerPoint - 50) {
          const pauseType = el.getAttribute("data-pause") as PauseType;
          if (pauseType && !el.hasAttribute("data-triggered")) {
            el.setAttribute("data-triggered", "true");
            handlePause(pauseType);
          }
        }
      });
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [speed, isPaused, isPlaying, handlePause]);

  useEffect(() => {
    if (isPlaying && !isPaused) {
      lastTimeRef.current = undefined;
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isPaused, animate]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (isPlaying && !isUserPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, isUserPaused]);

  const handleStart = () => {
    if (countdown !== null) return;
    setIsPlaying(false);
    setIsPaused(false);
    setIsUserPaused(false);
    setCountdown(3);
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      setIsPaused(false);
      setIsUserPaused(false);
      setCurrentPause(null);
    } else {
      setIsPaused(true);
      setIsUserPaused(true);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsUserPaused(false);
    setCurrentPause(null);
    scrollPositionRef.current = 0;
    setElapsedSeconds(0);
    setCountdown(null);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    // Reset pause triggers
    if (contentRef.current) {
      const pauseElements = contentRef.current.querySelectorAll("[data-triggered]");
      pauseElements.forEach((el) => el.removeAttribute("data-triggered"));
    }
  };

  const handleSpeedChange = (delta: number) => {
    setSpeed((prev) => Math.max(10, Math.min(200, prev + delta)));
  };

  const handlePauseDurationChange = (pauseType: PauseType, seconds: number) => {
    const clampedSeconds = Math.max(0.5, Math.min(20, seconds));
    const nextMs = Math.round(clampedSeconds * 1000);
    setPauseDurations((prev) => ({
      ...prev,
      [pauseType]: nextMs,
      ...(pauseType === "pause-medium" ? { "pause": nextMs } : {}),
    }));
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.parentElement?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    const timeoutId = window.setTimeout(() => {
      if (countdown === 1) {
        setCountdown(null);
        setIsPlaying(true);
        return;
      }
      setCountdown((prev) => (prev === null ? prev : prev - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [countdown]);

  const renderContent = () => {
    return parsedScript.map((part, index) => {
      if (part.type === "pause") {
        const pauseLabel = (() => {
          switch (part.pauseType) {
            case "pause-short":
              return "Pausa curta";
            case "pause-medium":
              return "Pausa média";
            case "pause-long":
              return "Pausa longa";
            default:
              return "Pausa";
          }
        })();
        const pauseClass = (() => {
          switch (part.pauseType) {
            case "pause-short":
              return "bg-green-500/30 text-green-300";
            case "pause-medium":
              return "bg-yellow-500/30 text-yellow-300";
            case "pause-long":
              return "bg-red-500/30 text-red-300";
            default:
              return "bg-yellow-500/30 text-yellow-300";
          }
        })();
        if (showPauseTags) {
          return (
            <span
              key={index}
              data-pause={part.pauseType}
              className={`inline-block px-2 py-1 mx-1 rounded text-sm ${pauseClass}`}
            >
              {pauseLabel}
            </span>
          );
        } else {
          return (
            <span
              key={index}
              data-pause={part.pauseType}
              className="inline-block w-0 h-0"
            />
          );
        }
      }
      if (part.type === "topic") {
        return (
          <span
            key={index}
            className="inline-block px-2 py-1 mx-1 rounded text-sm bg-purple-500/30 text-purple-300"
          >
            Mudança de assunto
          </span>
        );
      }
      return <span key={index}>{part.content}</span>;
    });
  };

  const formatElapsed = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const referencesText = references.length
    ? references
        .map((ref, index) => {
          const url = ref.url ? ` - ${ref.url}` : "";
          return `${index + 1}. ${ref.title}${url}`;
        })
        .join("\n")
    : "Nenhuma referencia disponivel.";

  return (
    <div
      className={`flex flex-col ${isFullscreen ? "h-screen" : ""}`}
      style={isFullscreen ? { backgroundColor } : undefined}
    >
      {!isFullscreen && (
        <Card className="mb-4">
          <CardContent className="py-3">
            <div className="text-sm text-muted-foreground mb-2">Referencias das noticias</div>
            <Textarea value={referencesText} readOnly rows={4} className="resize-none" />
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <Card className={`mb-4 ${isFullscreen ? "bg-background/80 backdrop-blur" : ""}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <Button onClick={handleStart} size="sm" disabled={countdown !== null}>
                  <Play className="w-4 h-4 mr-1" />
                  {countdown !== null ? "Preparando" : "Iniciar"}
                </Button>
              ) : (
                <Button onClick={handlePauseToggle} size="sm" variant={isPaused ? "default" : "secondary"}>
                  <Pause className="w-4 h-4 mr-1" />
                  {isPaused ? "Continuar" : "Pausar"}
                </Button>
              )}
              <Button onClick={handleRestart} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reiniciar
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {formatElapsed(elapsedSeconds)}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => handleSpeedChange(-10)} size="sm" variant="outline">
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="w-32">
                  <Slider
                    value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    min={10}
                    max={200}
                    step={5}
                  />
                </div>
                <Button onClick={() => handleSpeedChange(10)} size="sm" variant="outline">
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-16">{speed} px/s</span>
              </div>

              <Button onClick={() => setShowPauseTags(!showPauseTags)} size="sm" variant="outline">
                {showPauseTags ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              <Button onClick={toggleFullscreen} size="sm" variant="outline">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Fonte</span>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-[170px] h-8">
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.label} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Tamanho</span>
              <div className="w-36">
                <Slider
                  value={[fontSize]}
                  onValueChange={([v]) => setFontSize(v)}
                  min={18}
                  max={64}
                  step={2}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10">{fontSize}px</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Cor</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-10 rounded border border-border bg-transparent p-0"
                aria-label="Cor da fonte"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Fundo</span>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-8 w-10 rounded border border-border bg-transparent p-0"
                aria-label="Cor do fundo"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Pausas (s)</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Curta</span>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={pauseDurations["pause-short"] / 1000}
                  onChange={(event) => handlePauseDurationChange("pause-short", Number(event.target.value))}
                  className="h-8 w-16 rounded border border-border bg-transparent px-2 text-xs"
                  aria-label="Pausa curta em segundos"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Media</span>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={pauseDurations["pause-medium"] / 1000}
                  onChange={(event) => handlePauseDurationChange("pause-medium", Number(event.target.value))}
                  className="h-8 w-16 rounded border border-border bg-transparent px-2 text-xs"
                  aria-label="Pausa media em segundos"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Longa</span>
                <input
                  type="number"
                  min={0.5}
                  max={20}
                  step={0.5}
                  value={pauseDurations["pause-long"] / 1000}
                  onChange={(event) => handlePauseDurationChange("pause-long", Number(event.target.value))}
                  className="h-8 w-16 rounded border border-border bg-transparent px-2 text-xs"
                  aria-label="Pausa longa em segundos"
                />
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Teleprompter Display */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden text-white rounded-lg ${
          isFullscreen ? "flex-1" : "h-[500px]"
        }`}
        style={{ scrollBehavior: "auto", backgroundColor }}
        onWheel={(event) => {
          if (!containerRef.current || !contentRef.current) return;
          const maxScroll =
            contentRef.current.scrollHeight - containerRef.current.clientHeight;
          const nextScroll = Math.min(
            Math.max(0, containerRef.current.scrollTop + event.deltaY),
            maxScroll
          );
          containerRef.current.scrollTop = nextScroll;
          scrollPositionRef.current = nextScroll;
        }}
      >
        {/* Gradient overlays for readability */}
        <div
          className="absolute inset-x-0 top-0 h-24 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${backgroundColor}, transparent)` }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 z-10 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${backgroundColor}, transparent)` }}
        />

        {countdown !== null && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-black/60 px-10 py-6 text-6xl font-bold tracking-wide text-white">
              {countdown}
            </div>
          </div>
        )}
        
        {/* Center line indicator */}
        <div className="absolute inset-x-0 top-[30%] h-0.5 bg-primary/30 z-10 pointer-events-none" />
        
        <div
          ref={contentRef}
          className="px-8 py-32"
          style={{
            fontFamily,
            fontSize: isFullscreen ? Math.round(fontSize * 1.3) : fontSize,
            lineHeight: 1.6,
            color: textColor,
          }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
