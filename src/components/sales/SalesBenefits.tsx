import { useLanguage } from "@/i18n";

const SalesBenefits = () => {
  const { t } = useLanguage();

  const benefits = [
    { emoji: "⚡", text: t("Você grava mais rápido — roteiros prontos em segundos") },
    { emoji: "💪", text: t("Você se sente mais confiante ao falar para a câmera") },
    { emoji: "🎬", text: t("Seus vídeos ficam mais profissionais e envolventes") },
    { emoji: "📅", text: t("Você mantém consistência — postar vira rotina, não sofrimento") },
    { emoji: "📈", text: t("Você começa a crescer de verdade nas redes") },
  ];

  return (
    <section className="space-y-5 animate-stagger-fade" style={{ animationDelay: "300ms" }}>
      <h2 className="text-xl font-bold text-quiz-foreground text-center">
        {t("O que muda quando você usa o ThinkAndTalk")}
      </h2>

      <div className="rounded-2xl border border-quiz-purple/20 bg-gradient-to-br from-quiz-blue/5 to-quiz-purple/5 p-5 space-y-3">
        {benefits.map((b, i) => (
          <p key={i} className="flex items-start gap-3 text-sm text-quiz-foreground leading-relaxed">
            <span className="flex-shrink-0 mt-0.5">{b.emoji}</span>
            {b.text}
          </p>
        ))}
      </div>
    </section>
  );
};

export default SalesBenefits;
