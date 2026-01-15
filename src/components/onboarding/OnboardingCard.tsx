import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";

interface OnboardingCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  canContinue?: boolean;
  isLoading?: boolean;
  showSkip?: boolean;
}

export function OnboardingCard({
  children,
  onBack,
  onNext,
  onSkip,
  nextLabel,
  canContinue = true,
  isLoading = false,
  showSkip = true,
}: OnboardingCardProps) {
  const { t } = useLanguage();
  const effectiveNextLabel = nextLabel ?? t("Continuar");

  return (
    <div className="w-full max-w-2xl mx-auto animate-in">
      <div className="mb-8">{children}</div>

      <div className="flex items-center justify-between gap-4">
        <div>
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              disabled={isLoading}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Voltar")}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {showSkip && onSkip && (
            <Button
              variant="ghost"
              onClick={onSkip}
              disabled={isLoading}
              className="text-muted-foreground"
            >
              {t("Pular")}
            </Button>
          )}

          {onNext && (
            <Button
              onClick={onNext}
              disabled={!canContinue || isLoading}
              className="gap-2 min-w-[120px]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {effectiveNextLabel}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

