import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreatorProfile, GOAL_OPTIONS, LANGUAGE_OPTIONS } from "@/types/creatorProfile";

interface StepGoalProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

export function StepGoal({ profile, onChange, onBack, onComplete, isLoading }: StepGoalProps) {
  return (
    <OnboardingCard
      title="Not\u00EDcias do conte\u00FAdo"
      subtitle="Defina o objetivo e busque not\u00EDcias relevantes"
      onBack={onBack}
      onNext={onComplete}
      nextLabel="Buscar not\u00EDcias"
      showSkip={false}
      isLoading={isLoading}
    >
      <div className="space-y-8">
        {/* Content goal */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Qual \u00E9 o objetivo principal?</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GOAL_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={option.label}
                description={option.description}
                icon={option.icon}
                selected={profile.content_goal === option.value}
                onClick={() => onChange({ content_goal: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        {/* Script language */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Idioma do roteiro</Label>
          <div className="flex gap-2">
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
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-medium">Incluir chamada para a a\u00E7\u00E3o?</Label>
              <p className="text-sm text-muted-foreground">
                Adicionar CTA ao final do roteiro
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
              placeholder="Ex: Se inscreva no canal, ative o sininho, deixe seu like..."
              rows={2}
              className="resize-none"
            />
          )}
        </div>
      </div>
    </OnboardingCard>
  );
}
