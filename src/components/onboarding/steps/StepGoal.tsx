import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreatorProfile, GOAL_OPTIONS, LANGUAGE_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";

interface StepGoalProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export function StepGoal({ profile, onChange, onBack, onComplete, isLoading }: StepGoalProps) {
  const { t } = useLanguage();

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
          <Label className="text-base font-medium">{t("Qual é o objetivo principal?")}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                selected={profile.content_goal === option.value}
                onClick={() => onChange({ content_goal: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-base font-medium">{t("Idioma do roteiro")}</Label>
          <div className="flex gap-2 flex-wrap">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ script_language: option.value })}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  profile.script_language === option.value
                    ? "border-primary bg-accent text-primary font-medium"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">{t("Incluir chamada para a ação?")}</Label>
              <p className="text-sm text-muted-foreground">
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
              className="resize-none"
            />
          )}
        </div>
      </div>
    </OnboardingCard>
  );
}

