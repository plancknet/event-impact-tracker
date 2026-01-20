import { Button } from "@/components/ui/button";

interface QuizAgeHighlightProps {
  ageRange?: string;
  mainGoal?: string;
  currentIndex: number;
  totalQuestions: number;
  onContinue: () => void;
}

const ageImageSources: Record<
  string,
  { avif: string; webp: string }
> = {
  under_18: {
    avif: "/imgs/m18-512.avif 1x, /imgs/m18-1024.avif 2x",
    webp: "/imgs/m18-512.webp 1x, /imgs/m18-1024.webp 2x",
  },
  "18_24": {
    avif: "/imgs/18-24-512.avif 1x, /imgs/18-24-1024.avif 2x",
    webp: "/imgs/18-24-512.webp 1x, /imgs/18-24-1024.webp 2x",
  },
  "25_34": {
    avif: "/imgs/25-34-512.avif 1x, /imgs/25-34-1024.avif 2x",
    webp: "/imgs/25-34-512.webp 1x, /imgs/25-34-1024.webp 2x",
  },
  "35_44": {
    avif: "/imgs/35-44-512.avif 1x, /imgs/35-44-1024.avif 2x",
    webp: "/imgs/35-44-512.webp 1x, /imgs/35-44-1024.webp 2x",
  },
  "45_plus": {
    avif: "/imgs/45m-512.avif 1x, /imgs/45m-1024.avif 2x",
    webp: "/imgs/45m-512.webp 1x, /imgs/45m-1024.webp 2x",
  },
};

const QuizAgeHighlight = ({
  ageRange,
  mainGoal,
  currentIndex,
  totalQuestions,
  onContinue,
}: QuizAgeHighlightProps) => {
  const progress = ((currentIndex + 1) / totalQuestions) * 100;
  const imageSources = ageRange ? ageImageSources[ageRange] : undefined;
  const quizFontFamily =
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
  const highlightClass = "text-quiz-blue font-semibold";

  const goalPhraseMap: Record<string, string> = {
    more_followers: "seguidores",
    more_views: "visualiza??es",
    more_engagement: "a??es de engajamento",
    more_messages_sales: "mensagens/vendas",
  };

  const goalPhrase = mainGoal ? goalPhraseMap[mainGoal] : undefined;

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
            {imageSources ? (
              <picture>
                <source type="image/avif" srcSet={imageSources.avif} />
                <source type="image/webp" srcSet={imageSources.webp} />
                <img
                  srcSet={imageSources.webp}
                  alt="Depoimento"
                  className="max-h-64 w-auto object-contain"
                  loading="eager"
                  decoding="async"
                />
              </picture>
            ) : (
              <div className="h-40 w-full rounded-xl bg-quiz-selected/30" />
            )}
          </div>

          <p
            className="text-quiz-foreground font-medium text-center"
            style={{ fontFamily: quizFontFamily, fontSize: "1.3rem" }}
          >
            Em menos de 7 dias eles conseguiram aumentar o n?mero de{" "}
            <span className={highlightClass} style={{ fontSize: "1.95rem" }}>
              {goalPhrase || "seguidores"}
            </span>
            . Voc? tamb?m vai <span className={highlightClass} style={{ fontSize: "1.95rem" }}>conseguir</span>!
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
