import { useLanguage } from "@/i18n";

interface SalesHeaderProps {
  minutes: string;
  seconds: string;
}

const SalesHeader = ({ minutes, seconds }: SalesHeaderProps) => {
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-50 border-b border-quiz-border/60 bg-quiz-card/90 backdrop-blur">
      <div className="container max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <picture>
            <source type="image/avif" srcSet="/imgs/ThinkAndTalk-64.avif 1x, /imgs/ThinkAndTalk-128.avif 2x" />
            <source type="image/webp" srcSet="/imgs/ThinkAndTalk-64.webp 1x, /imgs/ThinkAndTalk-128.webp 2x" />
            <img src="/imgs/ThinkAndTalk.png" alt="ThinkAndTalk" className="h-8 w-auto" loading="eager" decoding="async" fetchPriority="high" />
          </picture>
        </div>
        <div className="flex items-center gap-1.5 text-sm font-bold text-red-600">
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {t("Oferta expira em")} {minutes}:{seconds}
        </div>
      </div>
    </header>
  );
};

export default SalesHeader;
