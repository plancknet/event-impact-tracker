import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CreatorProfile, AUDIENCE_TYPE_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";

interface StepAudienceProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepAudience({ profile, onChange, onBack, onNext, onSkip }: StepAudienceProps) {
  const { t } = useLanguage();
  const ageMin = Math.max(0, Math.min(100, profile.audience_age_min));
  const ageMax = Math.max(ageMin, Math.min(100, profile.audience_age_max));
  const genderSplit = Math.max(0, Math.min(100, profile.audience_gender_split));

  return (
    <OnboardingCard
      title={t("Seu público")}
      subtitle={t("Para quem você cria conteúdo?")}
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-medium">{t("Quem é sua audiência principal?")}</Label>
          <div className="grid grid-cols-2 gap-3">
            {AUDIENCE_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                selected={profile.audience_type === option.value}
                onClick={() => onChange({ audience_type: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">{t("Faixa etária do público")}</Label>
          <div className="px-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>0</span>
              <span className="font-medium text-foreground">
                {t("{min} - {max} anos", { min: String(ageMin), max: String(ageMax) })}
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

        <div className="space-y-4">
          <Label className="text-base font-medium">{t("Distribuição de sexo")}</Label>
          <div className="grid gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("Masculino")}</span>
                <span className="font-medium text-foreground">{genderSplit}%</span>
              </div>
              <Slider
                value={[genderSplit]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => {
                  onChange({ audience_gender_split: value });
                }}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("Feminino")}</span>
                <span className="font-medium text-foreground">{100 - genderSplit}%</span>
              </div>
              <Slider
                value={[100 - genderSplit]}
                min={0}
                max={100}
                step={1}
                onValueChange={([value]) => {
                  onChange({ audience_gender_split: 100 - value });
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}

