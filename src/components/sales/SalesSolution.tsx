import { useLanguage } from "@/i18n";

const SalesSolution = () => {
  const { t } = useLanguage();

  const steps = [
    { emoji: "🎯", text: t("Escolha seu tema") },
    { emoji: "🤖", text: t("A IA cria um roteiro estratégico") },
    { emoji: "📱", text: t("Grave lendo no teleprompter integrado") },
    { emoji: "🚀", text: t("Publique com segurança") },
  ];

  return (
    <section className="space-y-5 animate-stagger-fade" style={{ animationDelay: "200ms" }}>
      <h2 className="text-xl font-bold text-quiz-foreground text-center">
        {t("Conheça o ThinkAndTalk")}
      </h2>

      <p className="text-sm text-quiz-muted text-center leading-relaxed">
        {t("O app que transforma qualquer pessoa em criador de conteúdo consistente — mesmo sem experiência.")}
      </p>

      <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-quiz-blue/10 to-quiz-purple/10 flex items-center justify-center text-lg">
              {step.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-quiz-purple">{i + 1}.</span>
                <p className="text-sm font-medium text-quiz-foreground">{step.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SalesSolution;
