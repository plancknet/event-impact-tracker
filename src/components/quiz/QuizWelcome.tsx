import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";

interface QuizWelcomeProps {
  onStart: () => void;
}

const QuizWelcome = ({ onStart }: QuizWelcomeProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        <img
          src="/imgs/TAT_Logo_sem_fundo_500px.png"
          alt="ThinkAndTalk"
          className="w-32 h-32 object-contain"
        />

        <div className="space-y-4">
          <h1 className="text-3xl font-semibold text-quiz-foreground leading-tight">
            {t("Descubra seu perfil como")}{" "}
            <span className="bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
              {t("Criador de Vídeo")}
            </span>
          </h1>

          <p className="text-lg text-quiz-muted">
            {t("Responda algumas perguntas rápidas e receba um plano personalizado")}
          </p>
        </div>

        <Button
          onClick={onStart}
          size="lg"
          className="w-full max-w-xs h-14 text-lg font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        >
          {t("Começar agora")}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 text-sm text-quiz-muted">
          <Clock className="h-4 w-4" />
          <span>{t("Leva menos de 1 minuto")}</span>
        </div>
      </div>
    </div>
  );
};

export default QuizWelcome;
