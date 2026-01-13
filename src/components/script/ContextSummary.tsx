import { CreatorProfile } from "@/types/creatorProfile";
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

interface ContextSummaryProps {
  profile: CreatorProfile;
  onEditProfile?: () => void;
}

export function ContextSummary({ profile, onEditProfile }: ContextSummaryProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDurationLabel = () => {
    const duration = profile.target_duration;
    const unit = profile.duration_unit === "words" ? "palavras" : "min";
    return `${duration} ${unit}`;
  };

  const getToneLabel = () => {
    const tones: Record<string, string> = {
      calmo: "Calmo",
      conversacional: "Conversacional",
      energetico: "Energ\u00E9tico",
      educativo: "Educativo",
      persuasivo: "Persuasivo",
    };
    return tones[profile.speaking_tone] || profile.speaking_tone;
  };

  const getAudienceLabel = () => {
    const audiences: Record<string, string> = {
      iniciantes: "Iniciantes",
      publico_geral: "P\u00FAblico geral",
      profissionais: "Profissionais",
      especialistas: "Especialistas",
    };
    return audiences[profile.audience_type] || profile.audience_type;
  };

  const getGoalLabel = () => {
    const goals: Record<string, string> = {
      ensinar: "Ensinar",
      informar: "Informar",
      entreter: "Entreter",
      persuadir: "Persuadir",
      vender: "Vender",
    };
    return goals[profile.content_goal] || profile.content_goal;
  };

  const ageRangeLabel = `${profile.audience_age_min}-${profile.audience_age_max} anos`;
  const genderLabel = `${profile.audience_gender_split}% masc / ${100 - profile.audience_gender_split}% fem`;

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
              <p className="text-muted-foreground">Tema</p>
              <p className="font-medium truncate">{profile.main_topic || "Sem tema"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Plataforma</p>
              <p className="font-medium">{profile.platform}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tipo de v\u00EDdeo</p>
              <p className="font-medium capitalize">{profile.video_type.replace("_", " ")}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Idioma</p>
              <p className="font-medium">{profile.script_language}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Faixa et\u00E1ria</p>
              <p className="font-medium">{ageRangeLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sexo</p>
              <p className="font-medium">{genderLabel}</p>
            </div>
          </div>

          {onEditProfile && (
            <div className="mt-4 pt-4 border-t flex justify-end">
              <Button variant="ghost" size="sm" onClick={onEditProfile} className="gap-2">
                <Settings2 className="w-4 h-4" />
                Editar perfil
              </Button>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
