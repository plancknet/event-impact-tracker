import { ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";

interface SalesOfferProps {
  onCtaClick: () => void;
  isLoading: boolean;
}

const SalesOffer = ({ onCtaClick, isLoading }: SalesOfferProps) => {
  const { t } = useLanguage();

  return (
    <section className="space-y-5 animate-stagger-fade" style={{ animationDelay: "500ms" }}>
      <h2 className="text-xl font-bold text-quiz-foreground text-center leading-snug">
        {t("Hoje você pode começar por menos do que um café por dia.")}
      </h2>

      {/* Price Card */}
      <div className="rounded-2xl border-2 border-quiz-purple/30 bg-gradient-to-br from-quiz-purple/10 to-quiz-blue/10 p-6 text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-quiz-purple/10 rounded-full text-quiz-purple text-xs font-semibold">
          ♾️ {t("Acesso Vitalício")}
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className="line-through text-quiz-muted text-lg">R$ 78,90</span>
          <span className="text-4xl font-bold text-quiz-purple">R$ 47</span>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="bg-quiz-purple text-white text-xs px-2 py-1 rounded-full font-semibold">-40%</span>
          <span className="text-xs text-quiz-muted font-medium">{t("pagamento único")}</span>
        </div>

        <p className="text-sm text-quiz-foreground leading-relaxed">
          {t("Pague uma vez e tenha acesso à IA personalizada para sempre.")}
        </p>

        <button
          onClick={onCtaClick}
          disabled={isLoading}
          className="w-full h-14 px-4 text-base font-semibold text-white bg-gradient-to-r from-quiz-blue to-quiz-purple rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t("Processando...")}
            </>
          ) : (
            <>
              {t("Ativar meu ThinkAndTalk agora")}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>

      {/* Security badge */}
      <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-4 text-center text-sm text-quiz-foreground shadow-sm">
        <span className="inline-flex items-center justify-center gap-2">
          <ShieldCheck className="h-4 w-4 text-quiz-purple" />
          {t("Compra 100% segura, com criptografia de ponta a ponta.")}
        </span>
      </div>

      {/* Guarantee */}
      <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 flex flex-col items-center text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
          <ShieldCheck className="h-7 w-7 text-white" />
        </div>
        <p className="text-base font-semibold text-quiz-foreground">{t("Garantia de 7 dias")}</p>
        <p className="text-sm text-quiz-muted leading-relaxed">
          {t("Se você não ficar satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas.")}
        </p>
      </div>

      {/* Anchoring */}
      <p className="text-center text-sm text-quiz-muted italic">
        {t("Quanto custa continuar travando e perdendo oportunidades?")}
      </p>
    </section>
  );
};

export default SalesOffer;
