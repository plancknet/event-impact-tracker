import { OnboardingCard } from "../OnboardingCard";
import { OptionCard } from "../OptionCard";
import { Label } from "@/components/ui/label";
import { CreatorProfile, VIDEO_TYPE_OPTIONS, DURATION_OPTIONS, PLATFORM_OPTIONS } from "@/types/creatorProfile";
import { useLanguage } from "@/i18n";
import { Camera, Clapperboard, Film, Mic2, PlayCircle, Radio, Timer, Video, MessageCircle, Music, Briefcase, Clock } from "lucide-react";

interface StepFormatProps {
  profile: CreatorProfile;
  onChange: (updates: Partial<CreatorProfile>) => void;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export function StepFormat({ profile, onChange, onBack, onNext, onSkip }: StepFormatProps) {
  const { t } = useLanguage();
  const quizFontClass =
    "font-[Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]";

  const videoTypeIcons: Record<string, JSX.Element> = {
    video_curto: <Timer className="h-4 w-4" />,
    video_medio: <Video className="h-4 w-4" />,
    video_longo: <Film className="h-4 w-4" />,
    podcast: <Mic2 className="h-4 w-4" />,
    live: <Radio className="h-4 w-4" />,
  };

  const platformIcons: Record<string, JSX.Element> = {
    YouTube: <PlayCircle className="h-4 w-4" />,
    Instagram: <Camera className="h-4 w-4" />,
    TikTok: <Music className="h-4 w-4" />,
    LinkedIn: <Briefcase className="h-4 w-4" />,
    "Twitter/X": <MessageCircle className="h-4 w-4" />,
    Podcast: <Mic2 className="h-4 w-4" />,
  };

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
          <Label className={`text-base font-medium ${quizFontClass}`}>
            {t("Que tipo de vídeo você vai criar?")}
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {VIDEO_TYPE_OPTIONS.map((option) => (
              <OptionCard
                key={option.value}
                label={t(option.label)}
                description={t(option.description)}
                icon={videoTypeIcons[option.value] ?? <Clapperboard className="h-4 w-4" />}
                selected={profile.video_type === option.value}
                onClick={() => onChange({ video_type: option.value })}
                compact
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className={`text-base font-medium ${quizFontClass}`}>
            {t("Qual a duração alvo?")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ target_duration: option.value })}
                className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${quizFontClass} ${
                  profile.target_duration === option.value
                    ? "border-primary/40 bg-primary/5 text-primary font-medium"
                    : "border-border/60 hover:border-primary/30"
                }`}
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                {t(option.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label className={`text-base font-medium ${quizFontClass}`}>
            {t("Onde você vai publicar?")}
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {PLATFORM_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange({ platform: option.value })}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${quizFontClass} ${
                  profile.platform === option.value
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/60 hover:border-primary/30"
                }`}
              >
                <span className="text-muted-foreground">
                  {platformIcons[option.label] ?? <PlayCircle className="h-4 w-4" />}
                </span>
                <span className="text-xs font-medium">{t(option.label)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingCard>
  );
}
