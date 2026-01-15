import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CreatorProfile, TONE_OPTIONS, ENERGY_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";

interface StepStyleProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepStyle({ profile, onChange, onBack, onNext, onSkip }: StepStyleProps) {
  const { t } = useLanguage();
  const energyIndex = ENERGY_OPTIONS.findIndex((e) => e.value === profile.energy_level);

  return (
    <OnboardingCard
      title={t("Seu estilo")}
      subtitle={t("Como você quer soar no seu conteúdo?")}
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-medium">
            {t("Qual é o tom da sua fala?")}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TONE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                selected={profile.speaking_tone === option.value}
                onClick={() => onChange({ speaking_tone: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">{t("Nível de energia")}</Label>
          <div className="px-2">
            <Slider
              value={[energyIndex >= 0 ? energyIndex : 1]}
              min={0}
              max={2}
              step={1}
              onValueChange={([value]) => {
                const energy = ENERGY_OPTIONS[value];
                if (energy) {
                  onChange({ energy_level: energy.value });
                }
              }}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              {ENERGY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`text-center transition-colors ${
                    profile.energy_level === option.value
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  <div className="text-sm">{t(option.label)}</div>
                  <div className="text-xs">{t(option.description)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}

