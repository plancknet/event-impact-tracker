import { CreatorProfile, LANGUAGE_OPTIONS, VIDEO_TYPE_OPTIONS } from "@/types/creatorProfile";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Users,
  Target,
  Mic,
  ChevronDown,
  Settings2,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";
import { useLanguage } from "@/i18n";

interface ContextSummaryProps {
  profile: CreatorProfile;
  onEditProfile?: () => void;
}

export function ContextSummary({ profile, onEditProfile }: ContextSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const getDurationLabel = () => {
    const duration = profile.target_duration;
    const unit = profile.duration_unit === "words" ? t("palavras") : t("min");
    return `${duration} ${unit}`;
  };

  const getToneLabel = () => {
    const tones: Record<string, string> = {
      calmo: t("Calmo"),
      conversacional: t("Conversacional"),
      energetico: t("Energético"),
      educativo: t("Educativo"),
      persuasivo: t("Persuasivo"),
    };
    return tones[profile.speaking_tone] || profile.speaking_tone;
  };

  const getAudienceLabel = () => {
    const audiences: Record<string, string> = {
      iniciantes: t("Iniciantes"),
      publico_geral: t("Público geral"),
      profissionais: t("Profissionais"),
      especialistas: t("Especialistas"),
    };
    return audiences[profile.audience_type] || profile.audience_type;
  };

  const getGoalLabel = () => {
    const goals: Record<string, string> = {
      ensinar: t("Ensinar"),
      informar: t("Informar"),
      entreter: t("Entreter"),
      persuadir: t("Persuadir"),
      vender: t("Vender"),
    };
    return goals[profile.content_goal] || profile.content_goal;
  };

  const ageRangeLabel = t("{min}-{max} anos", {
    min: String(profile.audience_age_min),
    max: String(profile.audience_age_max),
  });
  const genderLabel = t("{male}% masc / {female}% fem", {
    male: String(profile.audience_gender_split),
    female: String(100 - profile.audience_gender_split),
  });
  const videoTypeLabel =
    VIDEO_TYPE_OPTIONS.find((option) => option.value === profile.video_type)?.label ??
    profile.video_type;
  const languageLabel =
    LANGUAGE_OPTIONS.find((option) => option.value === profile.script_language)?.label ??
    profile.script_language;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card p-4">
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between text-left">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{getDurationLabel()}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{getAudienceLabel()}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Mic className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{getToneLabel()}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-sm">
                <Target className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{getGoalLabel()}</span>
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="pt-4 mt-4 border-t">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">{t("Tema")}</p>
              <p className="font-medium truncate">{profile.main_topic || t("Sem tema")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Plataforma")}</p>
              <p className="font-medium">{profile.platform}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Tipo de vídeo")}</p>
              <p className="font-medium">{t(videoTypeLabel)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Idioma")}</p>
              <p className="font-medium">{t(languageLabel)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Faixa etária")}</p>
              <p className="font-medium">{ageRangeLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("Sexo")}</p>
              <p className="font-medium">{genderLabel}</p>
            </div>
          </div>

          {onEditProfile && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button variant="ghost" size="sm" onClick={onEditProfile} className="gap-2">
                <Settings2 className="w-4 h-4" />
                {t("Editar perfil")}
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
