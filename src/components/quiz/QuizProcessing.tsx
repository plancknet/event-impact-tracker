import { useEffect, useState, useMemo } from "react";
import { QuizAnswers } from "@/pages/Quiz";

interface QuizProcessingProps {
  currentIndex: number;
  totalQuestions: number;
  answers: QuizAnswers;
  onComplete: () => void;
}

const QuizProcessing = ({ currentIndex, totalQuestions, answers, onComplete }: QuizProcessingProps) => {
  const [canContinue, setCanContinue] = useState(false);
  const [visibleLines, setVisibleLines] = useState(0);
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const highlightClass = "text-quiz-blue font-semibold";

  const confidencePhraseMap: Record<string, string> = useMemo(() => ({
    sometimes_insecure: "ter segurança",
    freeze_lose_words: "destravar",
    avoid: "não procrastinar",
    very_uncomfortable: "ficar confortável",
  }), []);

  const challengePhraseMap: Record<string, string> = useMemo(() => ({
    lack_ideas: "a ter ideias",
    poor_editing: "a editar",
    no_engagement: "no engajamento",
    shyness: "a superar a timidez",
  }), []);

  const confidencePhrase =
    (answers.comfort_recording && confidencePhraseMap[answers.comfort_recording]) || "ter segurança";
  const challengePhrase =
    (answers.biggest_challenge && challengePhraseMap[answers.biggest_challenge]) || "a ter ideias";

  useEffect(() => {
    setCanContinue(false);
    setVisibleLines(1);
    const second = setTimeout(() => setVisibleLines(2), 1500);
    const third = setTimeout(() => setVisibleLines(3), 3000);
    const ready = setTimeout(() => setCanContinue(true), 5000);
    return () => {
      clearTimeout(second);
      clearTimeout(third);
      clearTimeout(ready);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-4 pt-2 pb-6 sm:px-6 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-start w-full max-w-lg mx-auto text-center space-y-5 pt-6">
        <p
          className={`text-quiz-foreground font-medium transition-opacity duration-500 ${visibleLines >= 1 ? "opacity-100" : "opacity-0"}`}
          style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
        >
          Nossa <span className={highlightClass} style={{ fontSize: "1.95rem" }}>IA</span> vai criar um plano{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>personalizado</span> para você{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>{confidencePhrase}</span> gravando vídeos.
        </p>
        <p
          className={`text-quiz-foreground font-medium transition-opacity duration-500 ${visibleLines >= 2 ? "opacity-100" : "opacity-0"}`}
          style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
        >
          Vamos te ajudar{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>{challengePhrase}</span>, criando um{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>roteiro</span> prático.
        </p>
        <p
          className={`text-quiz-foreground font-medium transition-opacity duration-500 ${visibleLines >= 3 ? "opacity-100" : "opacity-0"}`}
          style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
        >
          Em menos de <span className={highlightClass} style={{ fontSize: "1.95rem" }}>5 minutos</span> seu vídeo estará pronto.
        </p>
        {visibleLines >= 3 && (
          <button
            type="button"
            onClick={onComplete}
            disabled={!canContinue}
            className="w-full max-w-xs h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple text-white rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-[1.01] animate-fade-in"
            style={{ fontFamily: quizFontFamily }}
          >
            Continuar
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizProcessing;
