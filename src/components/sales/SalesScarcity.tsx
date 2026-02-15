import { useLanguage } from "@/i18n";

const SalesScarcity = () => {
  const { t } = useLanguage();

  return (
    <section className="space-y-4 animate-stagger-fade" style={{ animationDelay: "550ms" }}>
      {/* Quiz bonus */}
      <div className="rounded-2xl border border-quiz-purple/30 bg-gradient-to-br from-quiz-purple/5 to-quiz-blue/5 p-5 space-y-3 text-center">
        <p className="text-sm font-bold text-quiz-purple">🎁 {t("Bônus exclusivo para quem fez o diagnóstico")}</p>
        <p className="text-sm text-quiz-foreground leading-relaxed">
          {t("Você receberá um pack de roteiros virais prontos para usar nos seus primeiros vídeos.")}
        </p>
      </div>

      {/* WhatsApp group */}
      <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 text-center text-sm text-green-900 shadow-sm">
        <span className="inline-flex items-center justify-center gap-2 font-semibold">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
            <svg viewBox="0 0 32 32" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M16.04 5.33c-5.88 0-10.67 4.79-10.67 10.67 0 1.88.49 3.72 1.43 5.35l-1.52 5.55 5.69-1.49a10.61 10.61 0 0 0 5.07 1.3h.01c5.88 0 10.67-4.79 10.67-10.67 0-2.85-1.11-5.52-3.12-7.54a10.6 10.6 0 0 0-7.56-3.17zm0 19.37h-.01a8.73 8.73 0 0 1-4.45-1.2l-.32-.19-3.38.88.9-3.29-.21-.33a8.72 8.72 0 0 1-1.33-4.58c0-4.8 3.9-8.7 8.7-8.7 2.33 0 4.52.91 6.17 2.55a8.66 8.66 0 0 1 2.54 6.15c0 4.8-3.9 8.7-8.61 8.7zm4.78-6.57c-.26-.13-1.55-.76-1.79-.84-.24-.09-.42-.13-.6.13-.18.26-.69.84-.85 1.01-.16.18-.32.2-.58.07-.26-.13-1.1-.4-2.1-1.29-.78-.69-1.31-1.55-1.46-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.47.13-.16.18-.26.26-.44.09-.18.04-.33-.02-.46-.07-.13-.6-1.45-.82-1.99-.22-.53-.44-.46-.6-.47l-.51-.01c-.18 0-.46.07-.7.33-.24.26-.92.9-.92 2.2 0 1.29.94 2.54 1.07 2.72.13.18 1.84 2.81 4.47 3.94.63.27 1.12.43 1.5.55.63.2 1.2.17 1.66.1.51-.08 1.55-.63 1.77-1.23.22-.6.22-1.12.15-1.23-.06-.11-.24-.18-.5-.31z" />
            </svg>
          </span>
          {t("Acesso a grupo exclusivo no WhatsApp para networking e viralização de conteúdo.")}
        </span>
      </div>
    </section>
  );
};

export default SalesScarcity;
