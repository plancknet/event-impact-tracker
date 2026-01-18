import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { QuizQuestionData } from "./quizData";
import { cn } from "@/lib/utils";

interface QuizQuestionProps {
  question: QuizQuestionData;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (questionKey: string, value: string | string[]) => void;
  selectedAnswer?: string | string[];
  slideDirection: "left" | "right";
}

const QuizQuestion = ({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
  selectedAnswer,
  slideDirection,
}: QuizQuestionProps) => {
  const [localSelected, setLocalSelected] = useState<string[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showContent, setShowContent] = useState(true);

  // Reset local selection when question changes
  useEffect(() => {
    if (question.multiSelect) {
      setLocalSelected(Array.isArray(selectedAnswer) ? selectedAnswer : []);
    }
    setShowContent(true);
  }, [question.key, selectedAnswer, question.multiSelect]);

  const handleOptionClick = (value: string) => {
    if (isAnimating) return;

    if (question.multiSelect) {
      const newSelected = localSelected.includes(value)
        ? localSelected.filter(v => v !== value)
        : [...localSelected, value];
      setLocalSelected(newSelected);
    } else {
      // Single select - animate and advance
      setIsAnimating(true);
      setShowContent(false);
      
      setTimeout(() => {
        onAnswer(question.key, value);
        setIsAnimating(false);
      }, 300);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (localSelected.length > 0) {
      setIsAnimating(true);
      setShowContent(false);
      
      setTimeout(() => {
        onAnswer(question.key, localSelected);
        setIsAnimating(false);
      }, 300);
    }
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  const isSelected = (value: string) => {
    if (question.multiSelect) {
      return localSelected.includes(value);
    }
    return selectedAnswer === value;
  };

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 sm:px-6">
      {/* Progress Bar */}
      <div className="w-full max-w-lg mx-auto mb-8">
        <div className="h-2 bg-quiz-card rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div 
        className={cn(
          "flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto transition-all duration-300",
          showContent ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
        )}
      >
        {/* Question Text */}
        <div className="text-center mb-8 space-y-2">
          <h2
            className="text-xl sm:text-2xl font-semibold text-quiz-foreground leading-tight"
            style={{ fontFamily: quizFontFamily }}
          >
            {question.question}
          </h2>
          {question.subtitle && (
            <p
              className="text-quiz-muted text-sm sm:text-base"
              style={{ fontFamily: quizFontFamily }}
            >
              {question.subtitle}
            </p>
          )}
        </div>

        {/* Options */}
        <div className="w-full space-y-3">
          {question.options.map((option) => {
            const selected = isSelected(option.value);
            const IconComponent = option.icon;
            
            return (
              <button
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                disabled={isAnimating}
                className={cn(
                  "w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 text-left",
                  "hover:border-quiz-purple/30 hover:bg-quiz-selected/20",
                  selected 
                    ? "border-quiz-purple/40 bg-quiz-selected/50" 
                    : "border-quiz-border/60 bg-quiz-card",
                  isAnimating && "pointer-events-none"
                )}
              >
                {IconComponent && (
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                    selected ? "bg-quiz-purple/15" : "bg-quiz-muted/10"
                  )}>
                    <IconComponent className={cn(
                      "h-5 w-5",
                      selected ? "text-quiz-purple" : "text-quiz-muted"
                    )} />
                  </div>
                )}
                
                <span
                  className={cn(
                    "flex-1 font-medium",
                    selected ? "text-quiz-purple" : "text-quiz-foreground"
                  )}
                  style={{ fontFamily: quizFontFamily }}
                >
                  {option.label}
                </span>
                
                {selected && (
                  <div className="w-6 h-6 rounded-full bg-quiz-purple/15 border border-quiz-purple/40 flex items-center justify-center">
                    <Check className="h-4 w-4 text-quiz-purple" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Multi-select Confirm Button */}
        {question.multiSelect && localSelected.length > 0 && (
          <button
            onClick={handleMultiSelectConfirm}
            className="mt-6 w-full max-w-xs h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple text-white rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-[1.02]"
            style={{ fontFamily: quizFontFamily }}
          >
            Continuar ({localSelected.length} selecionado{localSelected.length > 1 ? 's' : ''})
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizQuestion;
