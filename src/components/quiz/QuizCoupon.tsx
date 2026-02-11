import { useState, useRef, useEffect } from "react";
import { Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface QuizCouponProps {
  onReveal: () => void;
}

const QuizCoupon = ({ onReveal }: QuizCouponProps) => {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchPercentage, setScratchPercentage] = useState(0);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#2F80ED");
    gradient.addColorStop(1, "#7B4AE2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t("✨ Raspe para revelar ✨"), rect.width / 2, rect.height / 2);
  }, [t]);

  const calculateScratchPercentage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return 0;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparentPixels = 0;
    const totalPixels = pixels.length / 4;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) transparentPixels++;
    }
    return (transparentPixels / totalPixels) * 100;
  };

  const scratch = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.lineWidth = 40;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPosRef.current = { x, y };
    const percentage = calculateScratchPercentage();
    setScratchPercentage(percentage);
    if (percentage > 50 && !isRevealed) {
      setIsRevealed(true);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setTimeout(() => { onReveal(); }, 2000);
    }
  };

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    lastPosRef.current = getPosition(e);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pos = getPosition(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => { isDrawingRef.current = false; };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-slide-in-right">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-6">
        <div className="flex items-center gap-2 animate-stagger-fade">
          <Gift className="h-8 w-8 text-quiz-purple" />
          <h2 className="text-2xl font-semibold text-quiz-foreground">
            {t("Você ganhou um presente!")}
          </h2>
        </div>

        <p className="text-quiz-foreground font-semibold text-lg animate-stagger-fade" style={{ animationDelay: "80ms" }}>
          {t("Seu perfil tem alto potencial com o uso do ThinkAndTalk.")}
        </p>

        <p className="text-quiz-muted animate-stagger-fade" style={{ animationDelay: "160ms" }}>
          {t("Raspe o cupom abaixo para descobrir seu desconto especial")}
        </p>

        <div
          className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-xl animate-scale-up-card"
          style={{ animationDelay: "240ms" }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-quiz-purple/10 to-quiz-blue/10 flex flex-col items-center justify-center p-6 border-4 border-dashed border-quiz-purple/30 rounded-2xl">
            <Sparkles className="h-10 w-10 text-quiz-purple mb-2" />
            <p className="text-6xl font-bold bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
              40%
            </p>
            <p className="text-xl font-semibold text-quiz-foreground mt-2">
              {t("DE DESCONTO")}
            </p>
            <p className="text-sm text-quiz-muted mt-1">{t("Código: CREATOR40")}</p>
          </div>

          <canvas
            ref={canvasRef}
            className={cn(
              "absolute inset-0 w-full h-full cursor-pointer touch-none",
              isRevealed && "pointer-events-none"
            )}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          />
        </div>

        {isRevealed && (
          <div className="animate-scale-up-card bg-quiz-card rounded-xl p-4 border border-quiz-border">
            <p className="text-quiz-foreground font-medium">
              {t("🎉 Parabéns! Seu cupom será aplicado automaticamente.")}
            </p>
          </div>
        )}

        {!isRevealed && (
          <p className="text-sm text-quiz-muted animate-pulse">
            {t("Use o dedo ou mouse para raspar")}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizCoupon;
