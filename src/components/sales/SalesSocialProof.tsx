import { Star } from "lucide-react";
import { useLanguage } from "@/i18n";

const SalesSocialProof = () => {
  const { t } = useLanguage();

  const testimonials = [
    { name: "Maria S.", text: t("Eu travava em tudo. Agora gravo 3 vídeos por semana sem estresse.") },
    { name: "Alberto D.", text: t("Em menos de 5 minutos o roteiro ficou pronto. Revolucionário!") },
    { name: "Ana B.", text: t("Só com o celular eu consegui. Meu engajamento triplicou.") },
    { name: "Carlo R.", text: t("Economizei tempo e muita grana. Sensacional!") },
  ];

  return (
    <section className="space-y-5 animate-stagger-fade" style={{ animationDelay: "450ms" }}>
      <h2 className="text-xl font-bold text-quiz-foreground text-center">
        {t("Eles também travavam antes…")}
      </h2>

      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="text-sm font-semibold text-quiz-foreground">4.9/5</span>
        <span className="text-xs text-quiz-muted">· 98% {t("satisfação")}</span>
      </div>

      <div className="space-y-3">
        {testimonials.map((t, i) => (
          <div key={i} className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-4">
            <p className="text-sm text-quiz-foreground italic leading-relaxed">"{t.text}"</p>
            <p className="text-xs font-semibold text-quiz-purple mt-2">— {t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SalesSocialProof;
