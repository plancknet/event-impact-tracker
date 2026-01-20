import { useEffect, useState } from "react";
import { QuizAnswers } from "@/pages/Quiz";

interface QuizProcessingProps {
  currentIndex: number;
  totalQuestions: number;
  answers: QuizAnswers;
  onComplete: () => void;
}

const QuizProcessing = ({ currentIndex, totalQuestions, answers, onComplete }: QuizProcessingProps) => {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const [activeSegment, setActiveSegment] = useState(0);
  const [canContinue, setCanContinue] = useState(false);
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const highlightClass = "text-quiz-blue font-semibold";

  const confidencePhraseMap: Record<string, string> = {
    sometimes_insecure: "ter segurança",
    freeze_lose_words: "destravar",
    avoid: "não procrastinar",
    very_uncomfortable: "ficar confortável",
  };

  const challengePhraseMap: Record<string, string> = {
    lack_ideas: "te dar ideias práticas",
    poor_editing: "te dar dicas mágicas de edição",
    no_engagement: "te ajudar no engajamento",
    shyness: "te ajudar superar a timidez",
  };

  const timePhraseMap: Record<string, string> = {
    less_30min: "30 minutos",
    "30min_1h": "1 hora",
    "1_2h": "2 horas",
    more_2h: "2 horas",
  };

  const confidencePhrase =
    (answers.comfort_recording && confidencePhraseMap[answers.comfort_recording]) || "ter segurança";
  const challengePhrase =
    (answers.biggest_challenge && challengePhraseMap[answers.biggest_challenge]) || "ter ideias";
  const timePhrase = (answers.editing_time && timePhraseMap[answers.editing_time]) || "30 minutos";

  useEffect(() => {
    setActiveSegment(0);
    setCanContinue(false);
    const first = setTimeout(() => setActiveSegment(1), 1700);
    const second = setTimeout(() => setActiveSegment(2), 3400);
    const ready = setTimeout(() => setCanContinue(true), 5000);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(ready);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col px-4 pt-2 pb-6 sm:px-6">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto text-center space-y-5">
        <p
          className="text-quiz-foreground font-medium"
          style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
        >
          Nossa <span className={highlightClass} style={{ fontSize: "1.95rem" }}>IA</span> vai criar um plano{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>personalizado</span> para você{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>{confidencePhrase}</span> gravando vídeos.
          Vamos {" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>{challengePhrase}</span>, criando um{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>roteiro</span> prático. Em menos de{" "}
          <span className={highlightClass} style={{ fontSize: "1.95rem" }}>{timePhrase}</span> seu vídeo estará pronto.
        </p>
        <div className="w-full max-w-xs">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={index <= activeSegment ? "h-2 rounded-full bg-emerald-500" : "h-2 rounded-full bg-quiz-card"}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={onComplete}
          disabled={!canContinue}
          className="w-full max-w-xs h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple text-white rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-[1.01]"
          style={{ fontFamily: quizFontFamily }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default QuizProcessing;
