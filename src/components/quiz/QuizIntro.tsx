import { useLanguage } from "@/i18n";
import { ArrowRight } from "lucide-react";

interface QuizIntroProps {
  onStart: () => void;
}

const QuizIntro = ({ onStart }: QuizIntroProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col items-center justify-center px-6 py-12 animate-fade-in">
      <div className="w-full max-w-lg flex flex-col items-center text-center space-y-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-quiz-foreground leading-snug">
          <span className="bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
            {t("Por que alguns criadores gravam vídeos com tanta facilidade enquanto outros travam na frente da câmera?")}
          </span>
        </h1>

        <div className="space-y-4">
          <p className="text-xl font-medium text-quiz-foreground">
            {t("Descubra o que está bloqueando seus vídeos.")}
          </p>

          <p className="text-base text-quiz-muted leading-relaxed">
            {t("Responda às próximas perguntas e, em menos de 3 minutos, veja a versão personalizada do ThinkAndTalk para você.")}
          </p>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="group inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-quiz-blue to-quiz-purple px-10 text-lg font-semibold text-white shadow-lg shadow-quiz-purple/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none"
        >
          {t("Vamos lá!")}
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};

export default QuizIntro;
