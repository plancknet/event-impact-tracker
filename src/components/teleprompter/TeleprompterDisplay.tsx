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

const PAUSE_DURATIONS = {
  "pause-short": 1500,
  "pause-medium": 3500,
  "pause-long": 6000,
  "pause": 2500,
};

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
  const [speed, setSpeed] = useState(50); // pixels per second
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPauseTags, setShowPauseTags] = useState(false);
  const [currentPause, setCurrentPause] = useState<string | null>(null);
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
          const pauseType = el.getAttribute("data-pause") as keyof typeof PAUSE_DURATIONS;
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
  }, [speed, isPaused, isPlaying]);

  const handlePause = (pauseType: keyof typeof PAUSE_DURATIONS) => {
    setIsPaused(true);
    setCurrentPause(pauseType);
    
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      setCurrentPause(null);
    }, PAUSE_DURATIONS[pauseType]);
  };

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

    if (isPlaying && !isPaused) {
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
  }, [isPlaying, isPaused]);

  const handleStart = () => {
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      setIsPaused(false);
      setCurrentPause(null);
    } else {
      setIsPaused(true);
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPause(null);
    scrollPositionRef.current = 0;
    setElapsedSeconds(0);
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
      {/* Controls */}
      <Card className={`mb-4 ${isFullscreen ? "absolute top-4 left-4 right-4 z-10 bg-background/80 backdrop-blur" : ""}`}>
        <CardContent className="py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <Button onClick={handleStart} size="sm">
                  <Play className="w-4 h-4 mr-1" />
                  Iniciar
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
          </div>

          {currentPause && (
            <div className="mt-2 text-center text-yellow-500 animate-pulse">
              ⏸ Pausa automática ({currentPause.replace("pause-", "").replace("pause", "normal")})
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={`mb-4 ${isFullscreen ? "absolute top-28 left-4 right-4 z-10 bg-background/80 backdrop-blur" : ""}`}>
        <CardContent className="py-3">
          <div className="text-sm text-muted-foreground mb-2">Referencias das noticias</div>
          <Textarea value={referencesText} readOnly rows={4} className="resize-none" />
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
