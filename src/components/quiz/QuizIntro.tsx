interface QuizIntroProps {
  onStart: () => void;
}

const QuizIntro = ({ onStart }: QuizIntroProps) => {
  const titleFont =
    "'Space Grotesk', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  const bodyFont =
    "'Manrope', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  return (
    <section className="relative min-h-screen overflow-hidden bg-quiz-background">
      <div className="absolute -top-32 -right-24 h-80 w-80 rounded-full bg-gradient-to-br from-quiz-blue/30 to-quiz-purple/30 blur-3xl" />
      <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-gradient-to-tr from-quiz-purple/20 to-quiz-blue/20 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_rgba(255,255,255,0))]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 pb-12 pt-10 sm:px-8">
        <div className="w-full max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <h1
                className="text-balance text-4xl font-semibold leading-tight text-quiz-foreground sm:text-5xl lg:text-6xl"
                style={{ fontFamily: titleFont }}
              >
                O Segredo dos criadores de conteúdo
              </h1>

              <p
                className="text-balance text-base text-quiz-muted sm:text-lg"
                style={{ fontFamily: bodyFont }}
              >
                Os maiores criadores de conteúdos estão utilizando IA personalizada para impulsionar suas carreiras.
                <span className="mt-2 block text-quiz-foreground">
                  Nós vamos te mostrar como, em apenas 3 minutos.
                </span>
              </p>

              <button
                type="button"
                onClick={onStart}
                className="group inline-flex h-12 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-quiz-blue to-quiz-purple px-8 text-base font-semibold text-white shadow-lg shadow-quiz-purple/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl focus-visible:outline-none"
                style={{ fontFamily: titleFont }}
              >
                Vamos lá!
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-sm transition-transform duration-300 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>

            <div className="hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default QuizIntro;
