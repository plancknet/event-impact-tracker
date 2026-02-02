import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AgeOption {
  value: string;
  label: string;
  image: {
    avif: string;
    webp: string;
  };
}

const ageOptions: AgeOption[] = [
  {
    value: "under_18",
    label: "Até 18",
    image: {
      avif: "/imgs/m18-512.avif 1x, /imgs/m18-1024.avif 2x",
      webp: "/imgs/m18-512.webp 1x, /imgs/m18-1024.webp 2x",
    },
  },
  {
    value: "18_24",
    label: "18-24",
    image: {
      avif: "/imgs/18-24-512.avif 1x, /imgs/18-24-1024.avif 2x",
      webp: "/imgs/18-24-512.webp 1x, /imgs/18-24-1024.webp 2x",
    },
  },
  {
    value: "25_34",
    label: "25-34",
    image: {
      avif: "/imgs/25-34-512.avif 1x, /imgs/25-34-1024.avif 2x",
      webp: "/imgs/25-34-512.webp 1x, /imgs/25-34-1024.webp 2x",
    },
  },
  {
    value: "35_44",
    label: "35-44",
    image: {
      avif: "/imgs/35-44-512.avif 1x, /imgs/35-44-1024.avif 2x",
      webp: "/imgs/35-44-512.webp 1x, /imgs/35-44-1024.webp 2x",
    },
  },
  {
    value: "45_plus",
    label: "45+",
    image: {
      avif: "/imgs/45m-512.avif 1x, /imgs/45m-1024.avif 2x",
      webp: "/imgs/45m-512.webp 1x, /imgs/45m-1024.webp 2x",
    },
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
          Programa de Criação de Vídeo personalizado
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
                "animate-scale-up-card",
                isSelected && "ring-2 ring-quiz-purple ring-offset-2"
              )}
              style={{
                animationDelay: `${index * 80}ms`,
              }}
            >
              {/* Image */}
              <picture>
                <source type="image/avif" srcSet={option.image.avif} />
                <source type="image/webp" srcSet={option.image.webp} />
                <img
                  src={option.image.webp.split(" ")[0]}
                  alt={`Faixa etária ${option.label}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="eager"
                  decoding="async"
                />
              </picture>

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Label Pill */}
              <div className="absolute bottom-3 left-3 right-3">
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
