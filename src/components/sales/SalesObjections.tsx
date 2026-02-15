import { useLanguage } from "@/i18n";

const SalesObjections = () => {
  const { t } = useLanguage();

  const faqs = [
    {
      q: t("Mas eu não sou bom falando…"),
      a: t("O roteiro já vem estruturado para facilitar sua fala. Você só precisa ler."),
    },
    {
      q: t("Vai parecer robótico?"),
      a: t("Você pode editar tudo e deixar com a sua personalidade. O roteiro é um ponto de partida."),
    },
    {
      q: t("Funciona para meu nicho?"),
      a: t("A IA adapta o roteiro para qualquer área: saúde, finanças, educação, beleza, tecnologia..."),
    },
    {
      q: t("Sou iniciante, consigo usar?"),
      a: t("Justamente por isso você precisa de estrutura. O app foi feito para quem está começando."),
    },
  ];

  return (
    <section className="space-y-5 animate-stagger-fade" style={{ animationDelay: "400ms" }}>
      <h2 className="text-xl font-bold text-quiz-foreground text-center">
        {t("Você pode estar pensando…")}
      </h2>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-4 space-y-2">
            <p className="text-sm font-semibold text-quiz-foreground">❓ {faq.q}</p>
            <p className="text-sm text-quiz-muted leading-relaxed">→ {faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SalesObjections;
