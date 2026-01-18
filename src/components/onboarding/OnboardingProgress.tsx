import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  onStepChange?: (step: number) => void;
  orientation?: "vertical" | "horizontal";
  className?: string;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels,
  onStepChange,
  orientation = "vertical",
  className,
}: OnboardingProgressProps) {
  const { t } = useLanguage();
  const labels = stepLabels ?? [
    t("Você"),
    t("Público"),
    t("Formato"),
    t("Estilo"),
    t("Objetivo"),
  ];
  const progress = totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;

  if (orientation === "horizontal") {
    return (
      <div className={cn("relative", className)}>
        <div className="absolute left-0 right-0 top-3 h-px bg-muted" />
        <div
          className="absolute left-0 top-3 h-px bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div className="grid grid-cols-6 gap-2">
          {labels.slice(0, totalSteps).map((label, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <button
                key={label}
                type="button"
                onClick={() => onStepChange?.(stepNumber)}
                className={cn(
                  "flex flex-col items-center gap-1 text-center transition-colors",
                  isCompleted && "text-primary",
                  isCurrent && "text-foreground font-medium",
                  !isCompleted && !isCurrent && "text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/10 text-primary border-2 border-primary",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="sr-only">{stepNumber}</span>
                </div>
                <span className="text-[10px] leading-tight">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-3 top-1 bottom-1 w-px bg-muted" />
      <div
        className="absolute left-3 top-1 w-px bg-primary transition-all duration-500 ease-out"
        style={{ height: `${progress}%` }}
      />

      <div className="flex flex-col gap-4 pl-6">
        {labels.slice(0, totalSteps).map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepChange?.(stepNumber)}
              className={cn(
                "flex items-center gap-3 text-left transition-colors",
                isCompleted && "text-primary",
                isCurrent && "text-foreground font-medium",
                !isCompleted && !isCurrent && "text-muted-foreground",
              )}
            >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary/10 text-primary border-2 border-primary",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  <span className="sr-only">{stepNumber}</span>
                </div>
              <span className="text-sm">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

