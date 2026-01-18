import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorProfile, EXPERTISE_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";
import { BadgeCheck, Leaf, Sparkles, Zap } from "lucide-react";

interface StepCreatorProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepCreator({ profile, onChange, onNext, onSkip }: StepCreatorProps) {
  const { t } = useLanguage();
  const canContinue = profile.main_topic.trim().length > 0;
  const quizFontClass =
    "font-[Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

  const expertiseIcons: Record<string, JSX.Element> = {
    iniciante: <Leaf className="h-4 w-4" />,
    intermediario: <Sparkles className="h-4 w-4" />,
    avancado: <Zap className="h-4 w-4" />,
    especialista: <BadgeCheck className="h-4 w-4" />,
  };

  return (
    <OnboardingCard
      title={t("Sobre você")}
      subtitle={t("Conte-nos sobre seu conteúdo e experiência")}
      onNext={onNext}
      onSkip={onSkip}
      canContinue={canContinue}
      showSkip={false}
    >
      <div className="space-y-8">
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
          <Label
            htmlFor="main_topic"
            className={`text-base font-medium text-emerald-800 ${quizFontClass}`}
          >
            {t("Sobre o que vamos falar hoje?")}
          </Label>
          <Input
            id="main_topic"
            value={profile.main_topic}
            onChange={(e) => onChange({ main_topic: e.target.value })}
            placeholder={t("Ex: Bitcoin, Finanças, Marketing Digital, Culinária...")}
            className={`h-12 text-base bg-white/80 border-emerald-200 focus-visible:ring-emerald-400 ${quizFontClass}`}
          />
          <p className={`text-sm text-muted-foreground ${quizFontClass}`}>
            {t("Separe múltiplos temas por vírgula")}
          </p>
        </div>

        <div className="space-y-3">
          <Label className={`text-base font-medium ${quizFontClass}`}>
            {t("Qual é o seu nível como criador?")}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EXPERTISE_OPTIONS.map((option) => (
              <div key={option.value} className="origin-top-left scale-[0.8]">
                <OptionCard
                  label={t(option.label)}
                  description={t(option.description)}
                  icon={expertiseIcons[option.value] ?? <Sparkles className="h-4 w-4" />}
                  selected={profile.expertise_level === option.value}
                  onClick={() => onChange({ expertise_level: option.value })}
                  compact
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}
