import { Check } from "lucide-react";
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
      <div className="w-full grid gap-3 md:grid-cols-2">
        {ageOptions.map((option, index) => {
          const isSelected = selectedValue === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={cn(
                "w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 text-left",
                "hover:border-quiz-purple/40 hover:bg-quiz-selected/30 hover:scale-[1.01]",
                "animate-stagger-fade",
                isSelected
                  ? "border-quiz-purple bg-quiz-selected/50 shadow-sm"
                  : "border-quiz-border/40 bg-quiz-card"
              )}
              style={{
                animationDelay: `${index * 80}ms`,
              }}
            >
              <span
                className={cn(
                  "flex-1 font-medium transition-colors duration-200",
                  isSelected ? "text-quiz-purple" : "text-quiz-foreground"
                )}
                style={{ fontFamily: quizFontFamily }}
              >
                {option.label}
              </span>
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                  isSelected
                    ? "bg-quiz-purple scale-100 opacity-100"
                    : "bg-quiz-border/30 scale-75 opacity-0"
                )}
              >
                <Check className="h-4 w-4 text-white" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizAgeCards;
