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
      <div className="w-full max-w-lg mx-auto mb-2 md:hidden">
        <div className="h-2 bg-quiz-card rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-lg mx-auto text-center space-y-5 pt-6">
        <p
          className="text-quiz-foreground font-medium"
          style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
        >
          Falta bem pouco para ter uma{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>IA treinada</span> e configurada para voc?, para gerar{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>roteiro de v?deos</span> em um teleprompter.
        </p>

        <Button
          onClick={onContinue}
          size="lg"
          className="w-full max-w-xs h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01]"
          style={{ fontFamily: quizFontFamily }}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default QuizMidMessage;
