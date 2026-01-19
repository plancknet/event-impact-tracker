import { Button } from "@/components/ui/button";

interface QuizAgeHighlightProps {
  ageRange?: string;
  currentIndex: number;
  totalQuestions: number;
  onContinue: () => void;
}

const ageImageMap: Record<string, string> = {
  under_18: "/imgs/m18.png",
  "18_24": "/imgs/18-24.png",
  "25_34": "/imgs/25-34.png",
  "35_44": "/imgs/35-44.png",
  "45_plus": "/imgs/45m8.png",
};

const QuizAgeHighlight = ({
  ageRange,
  currentIndex,
  totalQuestions,
  onContinue,
}: QuizAgeHighlightProps) => {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const imageSrc = ageRange ? ageImageMap[ageRange] : undefined;
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

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

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg mx-auto">
        <div className="w-full grid gap-4">
          <div className="w-full rounded-2xl border border-quiz-border/60 bg-quiz-card p-4 flex items-center justify-center">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt="Depoimento"
                className="max-h-64 w-auto object-contain"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="h-40 w-full rounded-xl bg-quiz-selected/30" />
            )}
          </div>

          <p
            className="text-quiz-foreground font-medium text-center"
            style={{ fontFamily: quizFontFamily }}
          >
            Eles conseguiram e você também vai conseguir!
          </p>

          <Button
            onClick={onContinue}
            size="lg"
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.01]"
            style={{ fontFamily: quizFontFamily }}
          >
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuizAgeHighlight;
