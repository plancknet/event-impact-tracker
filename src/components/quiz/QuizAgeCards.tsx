import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeOption {
  value: string;
  label: string;
}

const ageOptions: AgeOption[] = [
  {
    value: "under_18",
    label: "Até 18",
  },
  {
    value: "18_24",
    label: "18-24",
  },
  {
    value: "25_34",
    label: "25-34",
  },
  {
    value: "35_44",
    label: "35-44",
  },
  {
    value: "45_plus",
    label: "45+",
  },
];

interface QuizAgeCardsProps {
  onSelect: (value: string) => void;
  selectedValue?: string;
}

const QuizAgeCards = ({ onSelect, selectedValue }: QuizAgeCardsProps) => {
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <h1
          className="text-2xl sm:text-3xl font-semibold text-quiz-foreground leading-tight"
          style={{ fontFamily: quizFontFamily }}
        >
          O Segredo dos criadores de conteúdo
        </h1>
        <h2
          className="text-xl sm:text-2xl font-medium text-quiz-foreground"
          style={{ fontFamily: quizFontFamily }}
        >
          Quantos anos você tem?
        </h2>
      </div>

      {/* Age Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {ageOptions.map((option, index) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                "relative aspect-[3/4] rounded-2xl overflow-hidden group transition-all duration-300",
                "hover:scale-[1.02] hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-quiz-purple focus:ring-offset-2",
                "bg-quiz-card border border-quiz-border",
                "animate-scale-up-card",
                isSelected && "ring-2 ring-quiz-purple ring-offset-2"
              )}
              style={{
                animationDelay: `${index * 80}ms`,
              }}
            >
              {/* Label Pill */}
              <div className="absolute inset-0 flex items-end justify-center p-3">
                <div
                  className={cn(
                    "flex items-center justify-between px-4 py-2.5 rounded-full backdrop-blur-sm transition-all duration-300",
                    "bg-white/90 text-quiz-foreground",
                    "group-hover:bg-gradient-to-r group-hover:from-quiz-blue group-hover:to-quiz-purple group-hover:text-white",
                    isSelected && "bg-gradient-to-r from-quiz-blue to-quiz-purple text-white"
                  )}
                >
                  <span
                    className="font-semibold text-sm sm:text-base"
                    style={{ fontFamily: quizFontFamily }}
                  >
                    {option.label}
                  </span>
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizAgeCards;
