import { Button } from "@/components/ui/button";

interface QuizMidMessageProps {
  currentIndex: number;
  totalQuestions: number;
  onContinue: () => void;
}

const QuizMidMessage = ({ currentIndex, totalQuestions, onContinue }: QuizMidMessageProps) => {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const highlightClass = "text-quiz-blue font-semibold";

  return (
    <div className="min-h-screen flex flex-col px-4 pt-2 pb-6 sm:px-6">
      {/* Progress Bar - Mobile */}
      <div className="w-full max-w-lg mx-auto mb-4 md:hidden">
        <div className="h-1.5 bg-quiz-border/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-lg mx-auto text-center space-y-6 pt-8 animate-slide-in-right">
        <p
          className="text-quiz-foreground font-medium animate-stagger-fade"
          style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
        >
          Falta bem pouco para ter um{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>aplicativo com IA</span> treinada e configurada para você, para gerar{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>roteiro de vídeos</span> em um teleprompter.
        </p>

        <Button
          onClick={onContinue}
          size="lg"
          className="w-full max-w-xs h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] animate-stagger-fade"
          style={{ fontFamily: quizFontFamily, animationDelay: "150ms" }}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default QuizMidMessage;
