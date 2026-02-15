import { ArrowRight, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";

interface SalesFinalCtaProps {
  onCtaClick: () => void;
  isLoading: boolean;
}

const SalesFinalCta = ({ onCtaClick, isLoading }: SalesFinalCtaProps) => {
  const { t } = useLanguage();

  return (
    <section className="space-y-6 pb-10 animate-stagger-fade" style={{ animationDelay: "600ms" }}>
      <div className="text-center space-y-2">
        <p className="text-lg font-bold text-quiz-foreground leading-snug">
          {t("Se você quer crescer, você precisa gravar.")}
        </p>
        <p className="text-lg font-bold bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
          {t("Se você quer gravar, você precisa de roteiro.")}
        </p>
      </div>

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
            🚀 {t("Começar agora")}
            <ArrowRight className="h-5 w-5" />
          </>
        )}
      </button>

      <p className="text-center text-xs text-quiz-muted">
        {t("Pagamento único · Acesso vitalício · Garantia de 7 dias")}
      </p>
    </section>
  );
};

export default SalesFinalCta;
