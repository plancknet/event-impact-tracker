import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CreatorProfile, AUDIENCE_TYPE_OPTIONS } from "@/types/creatorProfile";

interface StepAudienceProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepAudience({ profile, onChange, onBack, onNext, onSkip }: StepAudienceProps) {
  const ageMin = Math.max(0, Math.min(100, profile.audience_age_min));
  const ageMax = Math.max(ageMin, Math.min(100, profile.audience_age_max));
  const genderSplit = Math.max(0, Math.min(100, profile.audience_gender_split));

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

        {/* Age range */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Faixa et??ria do p??blico
          </Label>
          <div className="px-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">
                {ageMin} - {ageMax} anos
              </span>
              <span>100</span>
            </div>
            <Slider
              value={[ageMin, ageMax]}
              min={0}
              max={100}
              step={1}
              onValueChange={([minValue, maxValue]) => {
                const nextMin = Math.min(minValue, maxValue);
                const nextMax = Math.max(minValue, maxValue);
                onChange({ audience_age_min: nextMin, audience_age_max: nextMax });
              }}
              className="w-full mt-3"
            />
          </div>
        </div>

        {/* Gender split */}
        <div className="space-y-4">
          <Label className="text-base font-medium">
            Distribui????o de sexo
          </Label>
          <div className="px-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Feminino</span>
              <span className="font-medium text-foreground">
                {genderSplit}% masc / {100 - genderSplit}% fem
              </span>
              <span>Masculino</span>
            </div>
            <Slider
              value={[genderSplit]}
              min={0}
              max={100}
              step={1}
              onValueChange={([value]) => {
                onChange({ audience_gender_split: value });
              }}
              className="w-full mt-3"
            />
          </div>
        </div>

      </div>
    </OnboardingCard>
  );
}
