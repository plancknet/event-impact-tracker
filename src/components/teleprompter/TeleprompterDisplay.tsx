import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
  Minus,
  Plus,
} from "lucide-react";
import { useLanguage } from "@/i18n";

export interface TeleprompterSettings {
  speed: number;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundColor: string;
  showPauseTags: boolean;
  pauseDurations: {
    "pause-short": number;
    "pause-medium": number;
    "pause-long": number;
    "pause": number;
  };
}

export const DEFAULT_TELEPROMPTER_SETTINGS: TeleprompterSettings = {
  speed: 30,
  fontFamily: "Inter, system-ui, sans-serif",
  fontSize: 28,
  textColor: "#ffffff",
  backgroundColor: "#000000",
  showPauseTags: true,
  pauseDurations: {
    "pause-short": 500,
    "pause-medium": 1000,
    "pause-long": 1500,
    "pause": 1000,
  },
};

interface TeleprompterDisplayProps {
  script: string;
  references?: { title: string; url?: string | null }[];
  settings?: TeleprompterSettings;
  onSettingsChange?: (settings: TeleprompterSettings) => void;
  onBack?: () => void;
  autoEnableRecording?: boolean;
  autoRecordOnPlay?: boolean;
  onScriptComplete?: () => void;
}

const DEFAULT_PAUSE_DURATIONS = {
  "pause-short": 500,
  "pause-medium": 1000,
  "pause-long": 1500,
  "pause": 1000,
} as const;

type PauseType = keyof typeof DEFAULT_PAUSE_DURATIONS;

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter, system-ui, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "\"Times New Roman\", serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Courier", value: "\"Courier New\", monospace" },
];

export function TeleprompterDisplay({
  script,
  references = [],
  settings,
  onSettingsChange,
  onBack,
  autoEnableRecording = false,
  autoRecordOnPlay = false,
  onScriptComplete,
}: TeleprompterDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [speed, setSpeed] = useState(settings?.speed ?? DEFAULT_TELEPROMPTER_SETTINGS.speed);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPauseTags, setShowPauseTags] = useState(settings?.showPauseTags ?? DEFAULT_TELEPROMPTER_SETTINGS.showPauseTags);
  const [currentPause, setCurrentPause] = useState<string | null>(null);
  const [pauseDurations, setPauseDurations] = useState<Record<PauseType, number>>(
    settings?.pauseDurations ?? { ...DEFAULT_PAUSE_DURATIONS }
  );
  const [fontFamily, setFontFamily] = useState(settings?.fontFamily ?? DEFAULT_TELEPROMPTER_SETTINGS.fontFamily);
  const [fontSize, setFontSize] = useState(settings?.fontSize ?? DEFAULT_TELEPROMPTER_SETTINGS.fontSize);
  const [textColor, setTextColor] = useState(settings?.textColor ?? DEFAULT_TELEPROMPTER_SETTINGS.textColor);
  const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor ?? DEFAULT_TELEPROMPTER_SETTINGS.backgroundColor);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [recordEnabled, setRecordEnabled] = useState(autoEnableRecording);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [shouldDownload, setShouldDownload] = useState(false);
  const [recordOrientation, setRecordOrientation] = useState<"portrait" | "landscape">("portrait");
  const { t } = useLanguage();

  // Notify parent of settings changes
  const notifySettingsChange = useCallback(() => {
    if (onSettingsChange) {
      onSettingsChange({
        speed,
        fontFamily,
        fontSize,
        textColor,
        backgroundColor,
        showPauseTags,
        pauseDurations: pauseDurations as TeleprompterSettings["pauseDurations"],
      });
    }
  }, [onSettingsChange, speed, fontFamily, fontSize, textColor, backgroundColor, showPauseTags, pauseDurations]);

  // Debounce settings change notifications
  useEffect(() => {
    const timeout = setTimeout(notifySettingsChange, 300);
    return () => clearTimeout(timeout);
  }, [notifySettingsChange]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);
  const latestRecordedUrlRef = useRef<string | null>(null);
  const hasCompletedRef = useRef(false);
  

  // Draggable preview state (horizontal only within header)
  const [previewXPercent, setPreviewXPercent] = useState(50); // 0-100, centered
  const headerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; startPercent: number } | null>(null);

  // Word highlight state
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wordSpansRef = useRef<HTMLSpanElement[]>([]);

  // Header height for camera preview area
  const HEADER_HEIGHT = recordEnabled ? (recordOrientation === "portrait" ? (isRecording ? 200 : 160) : (isRecording ? 140 : 110)) : 0;

  // Draggable preview handlers (horizontal only)
  const handleDragStart = useCallback((clientX: number) => {
    dragStartRef.current = { x: clientX, startPercent: previewXPercent };
  }, [previewXPercent]);

  const handleDragMove = useCallback((clientX: number) => {
    if (!dragStartRef.current || !headerRef.current) return;
    const headerWidth = headerRef.current.clientWidth;
    const dx = clientX - dragStartRef.current.x;
    const dPercent = (dx / headerWidth) * 100;
    const newPercent = Math.max(10, Math.min(90, dragStartRef.current.startPercent + dPercent));
    setPreviewXPercent(newPercent);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX);
    const onMouseUp = () => handleDragEnd();
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) handleDragMove(e.touches[0].clientX);
    };
    const onTouchEnd = () => handleDragEnd();
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // Speed label helper
  const getSpeedLabel = (s: number) => {
    if (s <= 30) return "Lento";
    if (s <= 70) return "Normal";
    if (s <= 120) return "Rápido";
    return "Muito rápido";
  };

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
        const nextSlice = text.slice(match.index + match[0].length);
        if (!nextSlice.trimStart().startsWith("<pause-long>")) {
          parts.push({
            type: "pause",
            content: "<pause-long>",
            pauseType: "pause-long",
          });
        }
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

  const handlePause = useCallback((pauseType: PauseType, pauseWordIndex?: number) => {
    setIsPaused(true);
    setCurrentPause(pauseType);
    if (pauseWordIndex !== undefined && pauseWordIndex >= 0) {
      setHighlightIndex(pauseWordIndex);
    }
    
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
      setCurrentPause(null);
    }, pauseDurations[pauseType]);
  }, [pauseDurations]);

  const stopPreviewStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (previewRef.current) {
      previewRef.current.srcObject = null;
    }
  }, []);

  const ensurePreview = useCallback(async () => {
    if (mediaStreamRef.current) return;
    setRecordingError(null);
    try {
      const aspectRatio = recordOrientation == "portrait" ? 9 / 16 : 16 / 9;
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          aspectRatio,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30, max: 60 },
        },
        audio: {
          channelCount: 2,
          sampleRate: 48000,
          echoCancellation: false,
          noiseSuppression: false,
        },
      });
      mediaStreamRef.current = stream;
      if (previewRef.current) {
        previewRef.current.srcObject = stream;
        await previewRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      console.error("Failed to access camera:", err);
      setRecordingError(t("Não foi possível acessar a câmera."));
      setRecordEnabled(false);
    }
  }, [recordOrientation]);

  const triggerDownload = useCallback((url: string, mimeType: string) => {
    const extension = mimeType.includes("mp4")
      ? "mp4"
      : mimeType.includes("mpeg")
        ? "mpeg"
        : "webm";
    const link = document.createElement("a");
    link.href = url;
    link.download = `teleprompter.${extension}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }, []);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    await ensurePreview();
    const stream = mediaStreamRef.current;
    if (!stream || isRecording) return;

    recordedChunksRef.current = [];
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }

    try {
      const preferredTypes = [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4",
        "video/mpeg",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      const mimeType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
      const recorder = new MediaRecorder(
        stream,
        mimeType
          ? {
              mimeType,
              videoBitsPerSecond: 8_000_000,
              audioBitsPerSecond: 192_000,
            }
          : {
              videoBitsPerSecond: 8_000_000,
              audioBitsPerSecond: 192_000,
            }
      );
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const finalType = recorder.mimeType || "video/webm";
        const blob = new Blob(recordedChunksRef.current, { type: finalType });
        const url = URL.createObjectURL(blob);
        latestRecordedUrlRef.current = url;
        setRecordedUrl(url);
        setIsRecording(false);
        if (shouldDownload) {
          setShouldDownload(false);
          triggerDownload(url, finalType);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setRecordingError(t("Não foi possível iniciar a gravação."));
      setIsRecording(false);
    }
  }, [ensurePreview, isRecording, recordedUrl, shouldDownload, triggerDownload]);

  // Animate scrolling
  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = timestamp - lastTimeRef.current;
    lastTimeRef.current = timestamp;

    if (containerRef.current && contentRef.current && !isPaused) {
      const pixelsPerMs = speed / 1000;
      scrollPositionRef.current += delta * pixelsPerMs;
      
      const maxScroll = contentRef.current.scrollHeight - containerRef.current.clientHeight;
      
      // Allow scrolling all the way to the end (text disappears from view)
      if (scrollPositionRef.current >= maxScroll) {
        scrollPositionRef.current = maxScroll;
        // Stop only when fully scrolled
        setIsPlaying(false);
        stopRecording();
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onScriptComplete?.();
        }
      }
      
      containerRef.current.scrollTop = scrollPositionRef.current;

      // Update word highlight proportionally to scroll position
      const totalWords = wordSpansRef.current.filter(Boolean).length;
      if (maxScroll > 0 && totalWords > 0) {
        const progress = Math.min(scrollPositionRef.current / maxScroll, 1);
        const wordIdx = Math.min(Math.floor(progress * totalWords), totalWords - 1);
        setHighlightIndex(wordIdx);

        // Check if the highlighted word is a pause marker — trigger pause from highlight
        const currentSpan = wordSpansRef.current[wordIdx];
        if (currentSpan) {
          const pauseType = currentSpan.getAttribute("data-pause") as PauseType;
          if (pauseType && !currentSpan.hasAttribute("data-triggered")) {
            currentSpan.setAttribute("data-triggered", "true");
            handlePause(pauseType, wordIdx);
          }
        }
      }
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [speed, isPaused, isPlaying, handlePause, onScriptComplete, stopRecording]);

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

  const handleStart = async () => {
    if (countdown !== null) return;
    // Request camera from click-handler context (user gesture required)
    if (recordEnabled || autoRecordOnPlay) {
      if (!recordEnabled) setRecordEnabled(true);
      await ensurePreview();
    }
    setIsPlaying(false);
    setIsPaused(false);
    setIsUserPaused(false);
    setCountdown(3);
    setShowControls(false); // Auto-collapse controls on play
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    hasCompletedRef.current = false;
  };

  const handlePauseToggle = () => {
    if (isPaused) {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
      setIsPaused(false);
      setIsUserPaused(false);
      setCurrentPause(null);
      if (mediaRecorderRef.current?.state === "paused") {
        mediaRecorderRef.current.resume();
      }
    } else {
      setIsPaused(true);
      setIsUserPaused(true);
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.pause();
      }
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setIsPaused(false);
    setIsUserPaused(false);
    setCurrentPause(null);
    stopRecording();
    setShouldDownload(false);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    scrollPositionRef.current = 0;
    setElapsedSeconds(0);
    setCountdown(null);
    setHighlightIndex(-1);
    hasCompletedRef.current = false;
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
      onBack?.();
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
        if (recordEnabled || autoRecordOnPlay) {
          if (!recordEnabled) {
            setRecordEnabled(true);
          }
          void startRecording();
        }
        return;
      }
      setCountdown((prev) => (prev === null ? prev : prev - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [autoRecordOnPlay, countdown, recordEnabled, startRecording]);

  useEffect(() => {
    if (!autoEnableRecording) return;
    setRecordEnabled(true);
  }, [autoEnableRecording]);

  useEffect(() => {
    if (!recordEnabled) {
      stopRecording();
      setShouldDownload(false);
      stopPreviewStream();
      setRecordingError(null);
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }
      return;
    }
    // Skip auto-preview from useEffect when autoEnableRecording is set;
    // getUserMedia will be called from handleStart (user gesture context).
    if (!autoEnableRecording) {
      void ensurePreview();
    }
  }, [recordEnabled, ensurePreview, stopPreviewStream, stopRecording, recordedUrl, autoEnableRecording]);

  useEffect(() => {
    if (!recordEnabled) return;
    stopRecording();
    stopPreviewStream();
    if (!autoEnableRecording) {
      void ensurePreview();
    }
  }, [recordOrientation, recordEnabled, ensurePreview, stopPreviewStream, stopRecording, autoEnableRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
      stopPreviewStream();
      if (latestRecordedUrlRef.current) {
        URL.revokeObjectURL(latestRecordedUrlRef.current);
      }
    };
  }, [stopPreviewStream, stopRecording]);

  const renderContent = () => {
    wordSpansRef.current = [];
    let globalWordIndex = 0;
    return parsedScript.map((part, index) => {
      if (part.type === "pause") {
        const pauseLabel = (() => {
          switch (part.pauseType) {
            case "pause-short":
              return t("Pausa curta");
            case "pause-medium":
              return t("Pausa média");
            case "pause-long":
              return t("Pausa longa");
            default:
              return t("Pausa");
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
        const isLongPause = part.pauseType === "pause-long";
        const wordIdx = globalWordIndex++;
        if (showPauseTags) {
          return (
            <span key={index} className={isLongPause ? "block mt-4" : "inline"}>
              {isLongPause ? <span className="block h-4" /> : null}
              <span
                data-pause={part.pauseType}
                data-word-index={wordIdx}
                ref={(el) => { if (el) wordSpansRef.current[wordIdx] = el; }}
                className={`inline-block px-2 py-1 rounded text-sm transition-colors duration-100 ${pauseClass}`}
                style={{
                  outline: wordIdx === highlightIndex ? '2px solid rgba(255,255,255,0.4)' : 'none',
                  outlineOffset: '2px',
                }}
              >
                {pauseLabel}
              </span>
            </span>
          );
        }
        return (
          <span key={index} className={isLongPause ? "block mt-4" : "inline"}>
            {isLongPause ? <span className="block h-4" /> : null}
            <span
              data-pause={part.pauseType}
              data-word-index={wordIdx}
              ref={(el) => { if (el) wordSpansRef.current[wordIdx] = el; }}
              className="inline-block w-1 h-4"
            />
          </span>
        );
      }
      if (part.type === "topic") {
        return null;
      }
      // Split text into words for highlighting
      const words = part.content.split(/(\s+)/);
      return (
        <span key={index}>
          {words.map((word, wIdx) => {
            if (/^\s+$/.test(word)) {
              return <span key={wIdx}>{word}</span>;
            }
            const wordIdx = globalWordIndex++;
            return (
              <span
                key={wIdx}
                data-word-index={wordIdx}
                ref={(el) => {
                  if (el) wordSpansRef.current[wordIdx] = el;
                }}
                className="transition-all duration-75"
                style={{
                  backgroundColor: wordIdx === highlightIndex ? 'rgba(255,255,0,0.35)' : 'transparent',
                  borderRadius: wordIdx === highlightIndex ? '3px' : undefined,
                  padding: wordIdx === highlightIndex ? '1px 2px' : undefined,
                  color: wordIdx === highlightIndex ? '#ffffff' : undefined,
                  textShadow: wordIdx === highlightIndex ? '0 0 8px rgba(255,255,255,0.5)' : undefined,
                }}
              >
                {word}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const formatElapsed = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex flex-col ${isFullscreen ? "h-screen" : ""}`}
      style={isFullscreen ? { backgroundColor } : undefined}
    >
      {/* Controls */}
      <Card className={`mb-4 md:mb-4 md:static fixed inset-x-0 bottom-0 z-30 ${isFullscreen ? "bg-background/80 backdrop-blur" : "bg-background/95"} md:rounded-lg rounded-t-xl`}>
        <CardContent className="py-3 max-h-[50vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {onBack && (
                <Button onClick={onBack} size="sm" variant="outline">
                  {t("Voltar")}
                </Button>
              )}
              {!isPlaying ? (
                <Button onClick={handleStart} size="sm" disabled={countdown !== null}>
                  <Play className="w-4 h-4 mr-1" />
                  {countdown !== null ? t("Preparando") : t("Play")}
                </Button>
              ) : (
                <Button onClick={handlePauseToggle} size="sm" variant={isPaused ? "default" : "secondary"}>
                  <Pause className="w-4 h-4 mr-1" />
                  {isPaused ? t("Continuar") : t("Pausar")}
                </Button>
              )}
              <Button onClick={handleRestart} size="sm" variant="outline">
                <RotateCcw className="w-4 h-4 mr-1" />
                {t("Reiniciar")}
              </Button>
              <div className="flex items-center gap-2 flex-nowrap">
                <Button
                  onClick={() => {
                    if (isRecording) {
                      setShouldDownload(true);
                      stopRecording();
                    }
                  }}
                  size="sm"
                  variant="outline"
                  disabled={!isRecording}
                >
                  {t("Parar Gravação")}
                </Button>
                <Checkbox
                  id="recordVideo"
                  checked={recordEnabled}
                  onCheckedChange={(value) => setRecordEnabled(Boolean(value))}
                />
                <Label htmlFor="recordVideo" className="text-sm">
                  {t("Gravar vídeo")}
                </Label>
                {isRecording ? (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    REC {formatElapsed(elapsedSeconds)}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">{formatElapsed(elapsedSeconds)}</span>
                )}
              </div>
              {recordEnabled && (
                <div className="flex items-center gap-2 flex-nowrap">
                  <Button
                    size="sm"
                    variant={recordOrientation === "portrait" ? "default" : "outline"}
                    onClick={() => setRecordOrientation("portrait")}
                  >
                    {t("Vertical")}
                  </Button>
                  <Button
                    size="sm"
                    variant={recordOrientation === "landscape" ? "default" : "outline"}
                    onClick={() => setRecordOrientation("landscape")}
                  >
                    {t("Horizontal")}
                  </Button>
                </div>
              )}
              {recordedUrl && !isRecording && (
                <Button
                  size="sm"
                  variant="default"
                  className="animate-pulse"
                  onClick={() => triggerDownload(recordedUrl, "video/webm")}
                >
                  {t("Salvar vídeo")}
                </Button>
              )}
              <Button
                onClick={() => setShowControls((prev) => !prev)}
                size="sm"
                variant="outline"
              >
                {showControls ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                {showControls ? t("Recolher") : t("Expandir")}
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{t("Velocidade")}</span>
                <Button onClick={() => handleSpeedChange(-10)} size="sm" variant="outline">
                  <Minus className="w-4 h-4" />
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
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-24 text-center">{getSpeedLabel(speed)}</span>
              </div>

              <Button onClick={() => setShowPauseTags(!showPauseTags)} size="sm" variant="outline">
                {showPauseTags ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>

              <Button onClick={toggleFullscreen} size="sm" variant="outline">
                {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {showControls && (
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("Fonte")}</span>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="w-[170px] h-8">
                  <SelectValue placeholder={t("Fonte")} />
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
              <span className="text-xs text-muted-foreground">{t("Tamanho")}</span>
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
              <span className="text-xs text-muted-foreground">{t("Cor")}</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="h-8 w-10 rounded border border-border bg-transparent p-0"
                aria-label={t("Cor da fonte")}
              />
              </div>
              <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("Fundo")}</span>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                className="h-8 w-10 rounded border border-border bg-transparent p-0"
                aria-label={t("Cor do fundo")}
              />
              </div>
              <div className="flex flex-col gap-3 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground">{t("Pausas (s)")}</span>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">{t("Curta")}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePauseDurationChange("pause-short", pauseDurations["pause-short"] / 1000 - 0.5)
                    }
                    aria-label={t("Diminuir pausa curta")}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-36">
                    <Slider
                      value={[pauseDurations["pause-short"] / 1000]}
                      onValueChange={([value]) => handlePauseDurationChange("pause-short", value)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePauseDurationChange("pause-short", pauseDurations["pause-short"] / 1000 + 0.5)
                    }
                    aria-label={t("Aumentar pausa curta")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {pauseDurations["pause-short"] / 1000}s
                  </span>
                </div>
                <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-12">{t("Média")}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePauseDurationChange("pause-medium", pauseDurations["pause-medium"] / 1000 - 0.5)
                    }
                    aria-label={t("Diminuir pausa média")}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-36">
                    <Slider
                      value={[pauseDurations["pause-medium"] / 1000]}
                      onValueChange={([value]) => handlePauseDurationChange("pause-medium", value)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePauseDurationChange("pause-medium", pauseDurations["pause-medium"] / 1000 + 0.5)
                    }
                    aria-label={t("Aumentar pausa média")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {pauseDurations["pause-medium"] / 1000}s
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-12">{t("Longa")}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePauseDurationChange("pause-long", pauseDurations["pause-long"] / 1000 - 0.5)
                    }
                    aria-label={t("Diminuir pausa longa")}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <div className="w-36">
                    <Slider
                      value={[pauseDurations["pause-long"] / 1000]}
                      onValueChange={([value]) => handlePauseDurationChange("pause-long", value)}
                      min={0.5}
                      max={20}
                      step={0.5}
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handlePauseDurationChange("pause-long", pauseDurations["pause-long"] / 1000 + 0.5)
                    }
                    aria-label={t("Aumentar pausa longa")}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground w-10 text-right">
                    {pauseDurations["pause-long"] / 1000}s
                  </span>
                </div>
              </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Teleprompter Display */}
      <div
        ref={containerRef}
        className={`relative overflow-hidden text-white rounded-lg pb-40 md:pb-0 ${
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

        {/* Camera preview header */}
        {recordEnabled && (
          <div
            ref={headerRef}
            className="relative z-20 w-full flex items-center justify-center"
            style={{
              height: `${HEADER_HEIGHT}px`,
              backgroundColor,
              borderBottom: '2px solid rgba(255,255,255,0.15)',
            }}
          >
            <div
              ref={previewContainerRef}
              className={`absolute rounded-lg overflow-hidden shadow-lg cursor-grab active:cursor-grabbing ${
                isRecording
                  ? recordOrientation === "portrait"
                    ? "w-32 h-48 ring-2 ring-red-500/40"
                    : "w-48 h-32 ring-2 ring-red-500/40"
                  : recordOrientation === "portrait"
                    ? "w-24 h-36"
                    : "w-36 h-24"
              } bg-black`}
              style={{
                left: `${previewXPercent}%`,
                transform: 'translateX(-50%)',
                top: '50%',
                marginTop: isRecording
                  ? recordOrientation === "portrait" ? '-96px' : '-64px'
                  : recordOrientation === "portrait" ? '-72px' : '-48px',
                border: '3px solid rgba(0,0,0,0.9)',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.3), 0 4px 20px rgba(0,0,0,0.8)',
              }}
              onMouseDown={(e) => { e.preventDefault(); handleDragStart(e.clientX); }}
              onTouchStart={(e) => { if (e.touches.length === 1) handleDragStart(e.touches[0].clientX); }}
            >
              <video
                ref={previewRef}
                className="h-full w-full object-cover scale-x-[-1] pointer-events-none"
                muted
                playsInline
                autoPlay
              />
              {isRecording && (
                <div className="absolute top-1 left-1 flex items-center gap-1 bg-black/60 rounded px-1.5 py-0.5">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] text-red-300 font-medium">REC</span>
                </div>
              )}
              {recordingError && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70 px-2 text-center text-xs text-red-200">
                  {recordingError}
                </div>
              )}
            </div>
          </div>
        )}

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
          className="px-8 transition-all duration-300"
          style={{
            paddingTop: '2rem',
            fontFamily,
            fontSize: isFullscreen ? Math.round(fontSize * 1.3) : fontSize,
            lineHeight: 1.6,
            color: textColor,
          }}
        >
          {renderContent()}
          {/* Extra space to allow text to scroll completely off screen */}
          <div style={{ height: isFullscreen ? '100vh' : '500px' }} />
        </div>
      </div>
    </div>
  );
}

