import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { ChipSelector } from "../ChipSelector";
import { Label } from "@/components/ui/label";
import { CreatorProfile, AUDIENCE_TYPE_OPTIONS, PAIN_POINTS_OPTIONS } from "@/types/creatorProfile";

interface StepAudienceProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepAudience({ profile, onChange, onBack, onNext, onSkip }: StepAudienceProps) {
  return (
    <OnboardingCard
      title="Seu público"
      subtitle="Para quem você cria conteúdo?"
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
    >
      <div className="space-y-8">
        {/* Audience type */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Quem é sua audiência principal?
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {AUDIENCE_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                selected={profile.audience_type === option.value}
                onClick={() => onChange({ audience_type: option.value })}
                compact
              />
            ))}
          </div>
        </div>
        
        {/* Pain points */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Quais são as principais dores do seu público?
          </Label>
          <p className="text-sm text-muted-foreground">
            Selecione até 3 opções
          </p>
          <ChipSelector
            options={PAIN_POINTS_OPTIONS}
            selected={profile.audience_pain_points}
            onChange={(selected) => onChange({ audience_pain_points: selected })}
            multiple
            maxSelections={3}
          />
        </div>
      </div>
    </OnboardingCard>
  );
}
