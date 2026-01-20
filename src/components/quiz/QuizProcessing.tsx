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
    lack_ideas: "ter ideias",
    poor_editing: "editar",
    no_engagement: "engajar",
    shyness: "superar a timidez",
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
    const first = setTimeout(() => setActiveSegment(1), 1000);
    const second = setTimeout(() => setActiveSegment(2), 2000);
    const finish = setTimeout(() => onComplete(), 3000);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
      clearTimeout(finish);
    };
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
        <p
          className="text-quiz-foreground font-medium text-lg"
          style={{ fontFamily: quizFontFamily }}
        >
          Nós vamos criar um plano{" "}
          <span className={highlightClass}>personalizado</span> para você{" "}
          <span className={highlightClass}>{confidencePhrase}</span> gravando vídeos.
          Vamos te orientar em como{" "}
          <span className={highlightClass}>{challengePhrase}</span>, criando um{" "}
          <span className={highlightClass}>roteiro</span> prático em menos de{" "}
          <span className={highlightClass}>{timePhrase}</span>.
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
      </div>
    </div>
  );
};

export default QuizProcessing;
