import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { CreatorProfile, VIDEO_TYPE_OPTIONS, DURATION_OPTIONS, PLATFORM_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";

interface StepFormatProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepFormat({ profile, onChange, onBack, onNext, onSkip }: StepFormatProps) {
  const { t } = useLanguage();

  return (
    <OnboardingCard
      title={t("Formato do vídeo")}
      subtitle={t("Defina o tipo e duração do seu conteúdo")}
      onBack={onBack}
      onNext={onNext}
      onSkip={onSkip}
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <Label className="text-base font-medium">
            {t("Que tipo de vídeo você vai criar?")}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VIDEO_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                selected={profile.video_type === option.value}
                onClick={() => onChange({ video_type: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            {t("Qual a duração alvo?")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ target_duration: option.value })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  profile.target_duration === option.value
                    ? "border-primary bg-accent text-primary font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">
            {t("Onde você vai publicar?")}
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORM_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ platform: option.value })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  profile.platform === option.value
                    ? "border-primary bg-accent"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <span className="text-xs font-medium">{t(option.label)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}

