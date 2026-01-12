import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { ChipSelector } from "../ChipSelector";
import { Label } from "@/components/ui/label";
import {
  CreatorProfile,
  AUDIENCE_TYPE_OPTIONS,
  AUDIENCE_GENDER_OPTIONS,
  AUDIENCE_AGE_RANGE_OPTIONS,
} from "@/types/creatorProfile";

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
        
        {/* Gender */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Qual ? o sexo da sua audi?ncia?
          </Label>
          <ChipSelector
            options={AUDIENCE_GENDER_OPTIONS}
            selected={profile.audience_gender ? [profile.audience_gender] : []}
            onChange={(selected) => onChange({ audience_gender: selected[0] ?? "" })}
          />
        </div>

        {/* Age range */}
        <div className="space-y-3">
          <Label className="text-base font-medium">
            Qual ? a faixa et?ria predominante?
          </Label>
          <ChipSelector
            options={AUDIENCE_AGE_RANGE_OPTIONS}
            selected={profile.audience_age_range ? [profile.audience_age_range] : []}
            onChange={(selected) => onChange({ audience_age_range: selected[0] ?? "" })}
          />
        </div>
      </div>
    </OnboardingCard>
  );
}
