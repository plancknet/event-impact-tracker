import { useState } from "react";
import { StepCreator } from "./steps/StepCreator";
import { StepAudience } from "./steps/StepAudience";
import { StepFormat } from "./steps/StepFormat";
import { StepStyle } from "./steps/StepStyle";
import { StepGoal } from "./steps/StepGoal";
import { CreatorProfile } from "@/types/creatorProfile";

interface OnboardingFlowProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => Promise<void>;
}

const PROFILE_STEPS = 5;

export function OnboardingFlow({
  profile,
  onChange,
  currentStep,
  onStepChange,
  onComplete,
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

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await onComplete();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">
          Configure seu perfil de criador
        </h1>
        <p className="mt-2 text-muted-foreground">
          Vamos personalizar seus roteiros para soar como você.
        </p>
      </div>
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
  );
}
