import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { CreatorProfile, TONE_OPTIONS, ENERGY_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";
import { BookOpen, Briefcase, MessageCircle, Newspaper, Smile, Sparkles, Star } from "lucide-react";

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
  const quizFontClass =
    "font-[Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

  const toneIcons: Record<string, JSX.Element> = {
    conversacional: <MessageCircle className="h-4 w-4" />,
    profissional: <Briefcase className="h-4 w-4" />,
    entusiasmado: <Sparkles className="h-4 w-4" />,
    didatico: <BookOpen className="h-4 w-4" />,
    humoristico: <Smile className="h-4 w-4" />,
    inspirador: <Star className="h-4 w-4" />,
    jornalistico: <Newspaper className="h-4 w-4" />,
  };

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
          <Label className={`text-base font-medium ${quizFontClass}`}>
            {t("Qual é o tom da sua fala?")}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TONE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                icon={toneIcons[option.value] ?? <Sparkles className="h-4 w-4" />}
                selected={profile.speaking_tone === option.value}
                onClick={() => onChange({ speaking_tone: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Label className={`text-base font-medium ${quizFontClass}`}>{t("Nível de energia")}</Label>
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
                  className={`text-center transition-colors ${quizFontClass} ${
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
