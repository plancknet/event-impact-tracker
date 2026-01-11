import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

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
  title,
  subtitle,
  children,
  onBack,
  onNext,
  onSkip,
  nextLabel = "Continuar",
  canContinue = true,
  isLoading = false,
  showSkip = true,
}: OnboardingCardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto animate-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Content */}
      <div className="mb-8">
        {children}
      </div>
      
      {/* Navigation */}
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
              Voltar
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
              Pular
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
                  {nextLabel}
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
