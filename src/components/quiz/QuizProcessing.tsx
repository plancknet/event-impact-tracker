import { useEffect } from "react";

interface QuizProcessingProps {
  currentIndex: number;
  totalQuestions: number;
  onComplete: () => void;
}

const QuizProcessing = ({ currentIndex, totalQuestions, onComplete }: QuizProcessingProps) => {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

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

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto text-center space-y-5">
        <div className="h-12 w-12 rounded-full border-4 border-quiz-purple/30 border-t-quiz-purple animate-spin" />
        <p
          className="text-quiz-foreground font-medium"
          style={{ fontFamily: quizFontFamily }}
        >
          Nós vamos criar um plano personlizado para você
        </p>
      </div>
    </div>
  );
};

export default QuizProcessing;
