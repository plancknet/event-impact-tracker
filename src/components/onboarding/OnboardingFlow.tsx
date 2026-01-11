import { useState } from "react";
import { OnboardingProgress } from "./OnboardingProgress";
import { StepCreator } from "./steps/StepCreator";
import { StepAudience } from "./steps/StepAudience";
import { StepFormat } from "./steps/StepFormat";
import { StepStyle } from "./steps/StepStyle";
import { StepGoal } from "./steps/StepGoal";
import { CreatorProfile } from "@/types/creatorProfile";
import { Sparkles } from "lucide-react";

interface OnboardingFlowProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onComplete: () => Promise<void>;
}

const STEP_LABELS = ['Você', 'Público', 'Formato', 'Estilo', 'Objetivo'];
const TOTAL_STEPS = 5;

export function OnboardingFlow({ profile, onChange, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
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
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto px-4 py-8">
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
            Vamos personalizar seus roteiros para soar como você.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <OnboardingProgress 
            currentStep={currentStep} 
            totalSteps={TOTAL_STEPS}
            stepLabels={STEP_LABELS}
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
