import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { QuizQuestionData } from "./quizTypes";
import { cn } from "@/lib/utils";
import QuizAgeCards from "./QuizAgeCards";

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

  // Reset local selection when question changes
  useEffect(() => {
    if (question.multiSelect) {
      setLocalSelected(Array.isArray(selectedAnswer) ? selectedAnswer : []);
    }
  }, [question.key, selectedAnswer, question.multiSelect]);

  const handleOptionClick = (value: string) => {
    if (isAnimating) return;

    if (question.multiSelect) {
      const newSelected = localSelected.includes(value)
        ? localSelected.filter(v => v !== value)
        : [...localSelected, value];
      setLocalSelected(newSelected);
    } else {
      setIsAnimating(true);
      onAnswer(question.key, value);
      setTimeout(() => setIsAnimating(false), 400);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (localSelected.length > 0) {
      setIsAnimating(true);
      onAnswer(question.key, localSelected);
      setTimeout(() => setIsAnimating(false), 400);
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

  // Use slide animation based on direction
  const slideAnimationClass = slideDirection === "left" 
    ? "animate-slide-in-right" 
    : "animate-slide-in-left";

  // Check if this is the age question (first question)
  const isAgeQuestion = question.key === "age_range";

  return (
    <div className="min-h-screen flex flex-col px-4 pt-2 pb-6 sm:px-6">
      {/* Progress Bar - Mobile only */}
      <div className="w-full max-w-lg mx-auto mb-4 md:hidden">
        <div className="h-1.5 bg-quiz-border/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div
        key={question.key}
        className={cn(
          "flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto",
          slideAnimationClass
        )}
      >
        {/* Special Age Cards Layout */}
        {isAgeQuestion ? (
          <QuizAgeCards
            onSelect={(value) => handleOptionClick(value)}
            selectedValue={selectedAnswer as string}
          />
        ) : (
          <>
            {/* Question Text */}
            <div className="text-center mb-8 space-y-3">
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

            {/* Options with staggered animation */}
            <div
              className={cn(
                "w-full grid gap-3",
                ["editing_time", "creator_level", "audience_age", "video_duration", "energy_level"].includes(question.key)
                  ? "grid-cols-1"
                  : "md:grid-cols-2"
              )}
            >
              {question.options.map((option, index) => {
                const selected = isSelected(option.value);
                const IconComponent = option.icon;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    disabled={isAnimating}
                    className={cn(
                      "w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 text-left",
                      "hover:border-quiz-purple/40 hover:bg-quiz-selected/30 hover:scale-[1.01]",
                      "animate-stagger-fade",
                      selected 
                        ? "border-quiz-purple bg-quiz-selected/50 shadow-sm" 
                        : "border-quiz-border/40 bg-quiz-card",
                      isAnimating && "pointer-events-none"
                    )}
                    style={{
                      animationDelay: `${index * 60}ms`,
                    }}
                  >
                    {IconComponent && (
                      <div className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-200",
                        selected 
                          ? "bg-gradient-to-br from-quiz-blue/20 to-quiz-purple/20" 
                          : "bg-quiz-muted/10"
                      )}>
                        <IconComponent className={cn(
                          "h-5 w-5 transition-colors duration-200",
                          selected ? "text-quiz-purple" : "text-quiz-muted"
                        )} />
                      </div>
                    )}
                    
                    <span
                      className={cn(
                        "flex-1 font-medium transition-colors duration-200",
                        selected ? "text-quiz-purple" : "text-quiz-foreground"
                      )}
                      style={{ fontFamily: quizFontFamily }}
                    >
                      {option.label}
                    </span>
                    
                    {/* Animated checkmark */}
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                      selected 
                        ? "bg-quiz-purple scale-100 opacity-100" 
                        : "bg-quiz-border/30 scale-75 opacity-0"
                    )}>
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Multi-select Confirm Button */}
            {question.multiSelect && localSelected.length > 0 && (
              <button
                onClick={handleMultiSelectConfirm}
                className="mt-6 w-full max-w-xs h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple text-white rounded-xl shadow-lg hover:opacity-90 transition-all duration-300 hover:scale-[1.02] animate-fade-in"
                style={{ fontFamily: quizFontFamily }}
              >
                Continuar ({localSelected.length} selecionado{localSelected.length > 1 ? 's' : ''})
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default QuizQuestion;
