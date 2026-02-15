import { ArrowRight, Star } from "lucide-react";
import { useLanguage } from "@/i18n";

interface SalesHeroProps {
  onCtaClick: () => void;
  isLoading: boolean;
}

const SalesHero = ({ onCtaClick, isLoading }: SalesHeroProps) => {
  const { t } = useLanguage();

  return (
    <section className="text-center space-y-6 pt-8 pb-4 animate-stagger-fade">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-quiz-selected rounded-full text-quiz-purple font-medium text-xs">
        ✨ {t("Resultado do seu diagnóstico")}
      </div>

      <h1 className="text-2xl sm:text-[1.75rem] font-bold text-quiz-foreground leading-tight text-balance">
        {t("Pare de travar na hora de gravar.")}
        <br />
        <span className="bg-gradient-to-r from-quiz-blue to-quiz-purple bg-clip-text text-transparent">
          {t("Crie roteiros prontos em segundos com IA.")}
        </span>
      </h1>

      <p className="text-base text-quiz-muted leading-relaxed max-w-md mx-auto">
        {t("O ThinkAndTalk cria roteiros personalizados para o seu nicho e ainda funciona como teleprompter inteligente.")}
      </p>

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

export default SalesHero;
