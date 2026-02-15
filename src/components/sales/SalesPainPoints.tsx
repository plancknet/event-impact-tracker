import { useLanguage } from "@/i18n";

const SalesPainPoints = () => {
  const { t } = useLanguage();

  const pains = [
    t("Você abre a câmera e trava."),
    t("Você grava, apaga, grava de novo…"),
    t("Passa mais tempo pensando no que falar do que gravando."),
    t("Sente que poderia crescer, mas não consegue manter consistência."),
    t("Tem medo de parecer amador ou não saber o que dizer."),
  ];

  return (
    <section className="space-y-5 animate-stagger-fade" style={{ animationDelay: "100ms" }}>
      <h2 className="text-xl font-bold text-quiz-foreground text-center leading-snug">
        {t("Se você já passou por isso, você não está sozinho…")}
      </h2>

      <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-3">
        {pains.map((pain, i) => (
          <p key={i} className="flex items-start gap-3 text-sm text-quiz-foreground leading-relaxed">
            <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
            {pain}
          </p>
        ))}
      </div>

      <p className="text-center text-sm font-semibold text-quiz-purple">
        {t("O problema não é você. É a falta de estrutura.")}
      </p>
    </section>
  );
};

export default SalesPainPoints;
