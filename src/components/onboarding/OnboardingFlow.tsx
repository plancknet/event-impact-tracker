import { useState } from "react";
import { OnboardingProgress } from "./OnboardingProgress";
import { StepCreator } from "./steps/StepCreator";
import { StepAudience } from "./steps/StepAudience";
import { StepFormat } from "./steps/StepFormat";
import { StepStyle } from "./steps/StepStyle";
import { StepGoal } from "./steps/StepGoal";
import { CreatorProfile } from "@/types/creatorProfile";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OnboardingFlowProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => Promise<void>;
  onViewScripts: () => void;
}

const STEP_LABELS = [
  "Voc\u00ea",
  "P\u00fablico",
  "Formato",
  "Estilo",
  "Objetivo",
  "Roteiros",
];
const TOTAL_STEPS = 6;
const PROFILE_STEPS = 5;

export function OnboardingFlow({
  profile,
  onChange,
  currentStep,
  onStepChange,
  onComplete,
  onViewScripts,
}: OnboardingFlowProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < PROFILE_STEPS) {
      onStepChange(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleStepChange = (step: number) => {
    if (step === TOTAL_STEPS) {
      onViewScripts();
      return;
    }
    onStepChange(step);
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-end mb-6">
          <Button variant="outline" size="sm" onClick={onViewScripts}>
            Ver scripts gerados
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 text-primary mb-4">
            <Sparkles className="w-6 h-6" />
            <span className="text-lg font-semibold">ThinkAndTalk</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Configure seu perfil de criador
          </h1>
          <p className="mt-2 text-muted-foreground">
            Vamos personalizar seus roteiros para soar como voc\u00ea.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <OnboardingProgress
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
            onStepChange={handleStepChange}
          />
        </div>

        {/* Step content */}
        <div className="pb-20">
          {currentStep === 1 && (
            <StepCreator
              profile={profile}
              onChange={onChange}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 2 && (
            <StepAudience
              profile={profile}
              onChange={onChange}
              onBack={handleBack}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 3 && (
            <StepFormat
              profile={profile}
              onChange={onChange}
              onBack={handleBack}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 4 && (
            <StepStyle
              profile={profile}
              onChange={onChange}
              onBack={handleBack}
              onNext={handleNext}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 5 && (
            <StepGoal
              profile={profile}
              onChange={onChange}
              onBack={handleBack}
              onComplete={handleComplete}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
