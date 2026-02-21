import { ArrowRight, Star } from "lucide-react";
import { useLanguage } from "@/i18n";

interface DemoSalesHeroProps {
  onCtaClick: () => void;
  isLoading: boolean;
}

const DemoSalesHero = ({ onCtaClick, isLoading }: DemoSalesHeroProps) => {
  const { t } = useLanguage();

  return (
    <section className="text-center space-y-6 pt-8 pb-4 animate-stagger-fade">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-quiz-selected rounded-full text-quiz-purple font-medium text-xs">
        ✨ {t("Resultado da demonstração")}
      </div>

      <h1 className="text-2xl sm:text-[1.75rem] font-bold text-quiz-foreground leading-tight text-balance">
        {t("E ai? Gostou?")}
      </h1>

      <div className="text-left text-base text-quiz-foreground leading-relaxed max-w-md mx-auto space-y-1">
        <p className="font-medium">{t("Com o ThinkAndTalk você poderá:")}</p>
        <ul className="space-y-1 pl-1">
          <li>✅ {t("Colocar um prompt complementar")}</li>
          <li>✅ {t("Personalizar o texto")}</li>
          <li>✅ {t("Gravar o vídeo")}</li>
          <li>✅ {t("Ter suporte técnico")}</li>
          <li>✅ {t("Fazer Network via grupo no WhatsApp")}</li>
          <li>✅ {t("E muito mais...")}</li>
        </ul>
      </div>

      <button
        onClick={onCtaClick}
        disabled={isLoading}
        className="w-full h-14 px-4 text-base font-semibold text-white bg-gradient-to-r from-quiz-blue to-quiz-purple rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        🔥 {t("Quero meus roteiros prontos agora")}
        <ArrowRight className="h-5 w-5" />
      </button>

      <div className="flex items-center justify-center gap-2 text-sm text-quiz-muted">
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <span className="font-medium">{t("Milhares de roteiros já gerados")}</span>
      </div>
    </section>
  );
};

export default DemoSalesHero;
