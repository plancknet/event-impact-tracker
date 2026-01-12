import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
  onStepChange?: (step: number) => void;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepLabels = ["Você", "Público", "Formato", "Estilo", "Objetivo"],
  onStepChange,
}: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full space-y-3">
      {/* Progress bar */}
      <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex justify-between">
        {stepLabels.slice(0, totalSteps).map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <button
              key={label}
              type="button"
              onClick={() => onStepChange?.(stepNumber)}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isCompleted && "text-primary",
                isCurrent && "text-foreground font-medium",
                !isCompleted && !isCurrent && "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isCurrent && "bg-primary/10 text-primary border-2 border-primary",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>
              <span className="text-xs hidden sm:block">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
