import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreatorProfile, GOAL_OPTIONS, LANGUAGE_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";
import { BookOpen, Globe, Newspaper, ShoppingCart, Smile, Star, Users } from "lucide-react";

interface StepGoalProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export function StepGoal({ profile, onChange, onBack, onComplete, isLoading }: StepGoalProps) {
  const { t } = useLanguage();
  const quizFontClass =
    "font-[Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

  const goalIcons: Record<string, JSX.Element> = {
    informar: <Newspaper className="h-4 w-4" />,
    educar: <BookOpen className="h-4 w-4" />,
    entreter: <Smile className="h-4 w-4" />,
    inspirar: <Star className="h-4 w-4" />,
    vender: <ShoppingCart className="h-4 w-4" />,
    engajar: <Users className="h-4 w-4" />,
  };

  return (
    <OnboardingCard
      title={t("Objetivo do conteúdo")}
      subtitle={t("Defina o objetivo e busque notícias relevantes")}
      onBack={onBack}
      onNext={onComplete}
      nextLabel={t("Buscar notícias")}
      showSkip={false}
      isLoading={isLoading}
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <Label className={`text-base font-medium ${quizFontClass}`}>{t("Qual é o objetivo principal?")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                icon={goalIcons[option.value] ?? <Star className="h-4 w-4" />}
                selected={profile.content_goal === option.value}
                onClick={() => onChange({ content_goal: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className={`text-base font-medium ${quizFontClass}`}>{t("Idioma do roteiro")}</Label>
          <div className="flex gap-2 flex-wrap">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ script_language: option.value })}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${quizFontClass} ${
                  profile.script_language === option.value
                    ? "border-primary/40 bg-primary/5 text-primary font-medium"
                    : "border-border/60 hover:border-primary/30"
                }`}
              >
                <Globe className="h-4 w-4 text-muted-foreground" />
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className={`text-base font-medium ${quizFontClass}`}>{t("Incluir chamada para a ação?")}</Label>
              <p className={`text-sm text-muted-foreground ${quizFontClass}`}>
                {t("Adicionar CTA ao final do roteiro")}
              </p>
            </div>
            <Switch
              checked={profile.include_cta}
              onCheckedChange={(checked) => onChange({ include_cta: checked })}
            />
          </div>

          {profile.include_cta && (
            <Textarea
              value={profile.cta_template || ""}
              onChange={(e) => onChange({ cta_template: e.target.value })}
              placeholder={t("Ex: Se inscreva no canal, ative o sininho, deixe seu like...")}
              rows={2}
              className={`resize-none ${quizFontClass}`}
            />
          )}
        </div>
      </div>
    </OnboardingCard>
  );
}
