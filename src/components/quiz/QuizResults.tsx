import {
  Star,
  Target,
  ArrowRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const CHECKOUT_URL = "https://lastlink.com/p/C7229FE68/checkout-payment/";

const buildCheckoutUrl = (email?: string) => {
  const url = new URL(CHECKOUT_URL);
  const redirectUrl = `${window.location.origin}/premium/success`;
  url.searchParams.set("redirect_url", redirectUrl);
  if (email) {
    url.searchParams.set("email", email);
    url.searchParams.set("quiz_email", email);
  }
  return url.toString();
};

const QuizResults = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(600);
  const { toast } = useToast();

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      const left = Math.max(0, 600 - elapsed);
      setRemainingSeconds(left);
      if (left === 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleActivatePlan = async () => {
    setIsLoading(true);
    try {
      const preferredEmail = sessionStorage.getItem("pendingQuizEmail") || undefined;
      window.location.href = buildCheckoutUrl(preferredEmail || undefined);
    } catch (error: unknown) {
      console.error("Subscription error:", error);
      toast({
        title: "Erro ao iniciar assinatura",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderActivateButton = () => (
    <Button
      onClick={handleActivatePlan}
      size="lg"
      disabled={isLoading}
      className="w-full h-14 px-4 text-base sm:text-lg font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02]"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Processando...
        </>
      ) : (
        <span className="flex items-center justify-center gap-2 whitespace-normal text-center leading-snug">
          Ativar meu aplicativo personalizado por apenas R$ 47
          <ArrowRight className="h-5 w-5 flex-shrink-0" />
        </span>
      )}
    </Button>
  );

  const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
  const seconds = String(remainingSeconds % 60).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col bg-quiz-background">
      <header className="sticky top-0 z-50 border-b border-quiz-border/60 bg-quiz-card/90 backdrop-blur">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <picture>
              <source
                type="image/avif"
                srcSet="/imgs/ThinkAndTalk-64.avif 1x, /imgs/ThinkAndTalk-128.avif 2x"
              />
              <source
                type="image/webp"
                srcSet="/imgs/ThinkAndTalk-64.webp 1x, /imgs/ThinkAndTalk-128.webp 2x"
              />
              <img
                src="/imgs/ThinkAndTalk.png"
                alt="ThinkAndTalk"
                className="h-8 w-auto"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
          </div>
          <div className="text-sm font-bold text-red-600">
            Oferta valida por {minutes}:{seconds} minutos
          </div>
        </div>
      </header>

      <div className="flex flex-col px-4 py-8 sm:px-6 animate-slide-in-right">
      <div className="w-full max-w-lg mx-auto flex flex-col space-y-6">
        {/* Header Badge */}
        <div className="text-center space-y-2 animate-stagger-fade">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-quiz-selected rounded-full text-quiz-purple font-medium text-sm">
            <Target className="h-4 w-4" />
            Análise Completa
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-quiz-foreground">
            ThinkAndTalk personalizado para seu perfil
          </h1>
        </div>

        {/* Main Card */}
        <div 
          className="bg-gradient-to-br from-quiz-blue/10 to-quiz-purple/10 rounded-2xl p-6 border border-quiz-purple/20 space-y-4 animate-scale-up-card"
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-quiz-foreground leading-relaxed">
            Criamos um aplicativo com um plano sob medida para você criar vídeos com mais clareza, confiança e consistência usando roteiros inteligentes e teleprompter com IA.
          </p>

          <div className="flex items-center justify-center gap-2 text-quiz-purple font-semibold">
            <span className="line-through text-quiz-muted text-sm">R$ 78,90</span>
            <span className="text-xl text-[200%]">R$ 47</span>
            <span className="bg-quiz-purple text-white text-xs px-2 py-1 rounded-full">-40%</span>
            <span className="text-xs text-quiz-muted font-medium">pagamento único</span>
          </div>

          {renderActivateButton()}
        </div>

        {/* Destaque Acesso Vitalício */}
        <div className="rounded-2xl border-2 border-quiz-purple/30 bg-gradient-to-br from-quiz-purple/10 to-quiz-blue/10 p-5 text-center space-y-2 animate-scale-up-card" style={{ animationDelay: "120ms" }}>
          <p className="text-lg font-bold text-quiz-purple">♾️ Acesso vitalício</p>
          <p className="text-sm text-quiz-foreground leading-relaxed">
            Você faz um pagamento único de <span className="font-semibold">R$47</span> e tem acesso ao aplicativo com a IA personalizada para sempre!
          </p>
        </div>

        
        <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-4 text-center text-sm text-quiz-foreground shadow-sm">
          <span className="inline-flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-quiz-purple" />
            Compra 100% segura, com criptografia de ponta a ponta.
          </span>
        </div>

        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 p-4 text-center text-sm text-green-900 shadow-sm">
          <span className="inline-flex items-center justify-center gap-2 font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#25D366] text-white shadow-sm">
              <svg
                viewBox="0 0 32 32"
                width="14"
                height="14"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M16.04 5.33c-5.88 0-10.67 4.79-10.67 10.67 0 1.88.49 3.72 1.43 5.35l-1.52 5.55 5.69-1.49a10.61 10.61 0 0 0 5.07 1.3h.01c5.88 0 10.67-4.79 10.67-10.67 0-2.85-1.11-5.52-3.12-7.54a10.6 10.6 0 0 0-7.56-3.17zm0 19.37h-.01a8.73 8.73 0 0 1-4.45-1.2l-.32-.19-3.38.88.9-3.29-.21-.33a8.72 8.72 0 0 1-1.33-4.58c0-4.8 3.9-8.7 8.7-8.7 2.33 0 4.52.91 6.17 2.55a8.66 8.66 0 0 1 2.54 6.15c0 4.8-3.9 8.7-8.61 8.7zm4.78-6.57c-.26-.13-1.55-.76-1.79-.84-.24-.09-.42-.13-.6.13-.18.26-.69.84-.85 1.01-.16.18-.32.2-.58.07-.26-.13-1.1-.4-2.1-1.29-.78-.69-1.31-1.55-1.46-1.81-.15-.26-.02-.4.11-.53.12-.12.26-.31.39-.47.13-.16.18-.26.26-.44.09-.18.04-.33-.02-.46-.07-.13-.6-1.45-.82-1.99-.22-.53-.44-.46-.6-.47l-.51-.01c-.18 0-.46.07-.7.33-.24.26-.92.9-.92 2.2 0 1.29.94 2.54 1.07 2.72.13.18 1.84 2.81 4.47 3.94.63.27 1.12.43 1.5.55.63.2 1.2.17 1.66.1.51-.08 1.55-.63 1.77-1.23.22-.6.22-1.12.15-1.23-.06-.11-.24-.18-.5-.31z" />
              </svg>
            </span>
            Tenha acesso a um grupo exclusivo no WhatsApp para networking e alavancagem para viralização de conteúdo.
          </span>
        </div>

{/* Antes e Depois */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "150ms" }}>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-5">
            <div className="space-y-3">
              <p className="text-base font-semibold text-quiz-foreground">😓 Antes do ThinkAndTalk</p>
              <div className="space-y-2 text-sm text-quiz-foreground">
                <p>❌ Passava horas olhando para a tela sem saber o que falar no vídeo</p>
                <p>❌ Gravava vários takes e ainda assim não ficava satisfeito</p>
                <p>❌ Perdida(o) sobre o que postar e quando postar</p>
                <p>❌ Vídeos longos, confusos ou sem uma mensagem clara</p>
                <p>❌ Dependia de inspiração (que quase nunca vinha)</p>
                <p>❌ Falava travado(a), esquecia partes importantes ou se perdia no meio do vídeo</p>
                <p>❌ Falta de consistência: alguns dias postava, depois sumia</p>
                <p>❌ Sentia insegurança e vergonha ao gravar</p>
                <p>❌ Conteúdo não convertia em seguidores, leads ou vendas</p>
              </div>
            </div>
            <div className="border-t border-quiz-border/40" />
            <div className="space-y-3">
              <p className="text-base font-semibold text-quiz-foreground">🚀 Depois do ThinkAndTalk</p>
              <div className="space-y-2 text-sm text-quiz-foreground">
                <p>✅ Roteiros prontos em segundos, alinhados ao objetivo do vídeo</p>
                <p>✅ Gravação fluida com teleprompter ajustável</p>
                <p>✅ Clareza total sobre o que dizer, como dizer e em quanto tempo</p>
                <p>✅ Conteúdos objetivos, envolventes e fáceis de entender</p>
                <p>✅ Consistência real: postar virou rotina, não sofrimento</p>
                <p>✅ Confiança ao falar, mesmo para quem é tímido ou iniciante</p>
                <p>✅ Vídeos adaptados para Instagram, TikTok, YouTube, Reels, Shorts e Lives</p>
                <p>✅ Mais engajamento, retenção e conexão com o público</p>
                <p>✅ Mais autoridade, profissionalismo e resultados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Depoimentos */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "180ms" }}>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-base font-semibold text-quiz-foreground">4.9/5</span>
                <span className="text-sm text-quiz-muted">· 98% satisfação</span>
              </div>
            </div>
            <div className="space-y-3 text-sm text-quiz-foreground">
              <p className="italic">"Ficou incrível o resultado." — <span className="font-semibold">Maria S.</span></p>
              <p className="italic">"Em menos de 5 minutos ficou pronto. Revolucionário!" — <span className="font-semibold">Alberto D.</span></p>
              <p className="italic">"Só com o celular eu consegui." — <span className="font-semibold">Ana B.</span></p>
              <p className="italic">"Economizei tempo e muita grana. Sensacional!" — <span className="font-semibold">Carlo R.</span></p>
            </div>
          </div>
        </div>

        {renderActivateButton()}

        {/* Diferencial */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "260ms" }}>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
            <p className="text-quiz-foreground font-semibold text-base">
              A mesma técnica que os grandes criadores usam para gravar vídeos profissionais — agora no seu celular.
            </p>
            <div className="space-y-3 text-sm text-quiz-foreground">
              <p>✅ <span className="font-semibold">Técnica dos grandes criadores</span> — usada pelos maiores influenciadores</p>
              <p>📱 <span className="font-semibold">Só precisa do celular</span> — zero custo com edição</p>
              <p>⚡ <span className="font-semibold">Resultado em 5 minutos</span> — rapidez impressionante</p>
              <p>🎯 <span className="font-semibold">Sem conhecimento técnico</span> — qualquer pessoa consegue</p>
            </div>
          </div>
        </div>

        {renderActivateButton()}

        {/* Como funciona */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "340ms" }}>
          <p className="text-lg font-semibold text-quiz-foreground text-center">Como funciona?</p>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
            <div className="space-y-3 text-sm text-quiz-foreground">
              <p><span className="font-semibold text-quiz-purple">1.</span> Abra no celular</p>
              <p><span className="font-semibold text-quiz-purple">2.</span> Informe o tema do vídeo</p>
              <p><span className="font-semibold text-quiz-purple">3.</span> Selecione as notícias recentes</p>
              <p><span className="font-semibold text-quiz-purple">4.</span> A IA cria o roteiro</p>
            </div>
            <p className="text-quiz-foreground font-semibold text-center pt-2">
              ✨ Pronto — roteiro no teleprompter profissional
            </p>
          </div>
        </div>

        {renderActivateButton()}

        {/* Garantia */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "480ms" }}>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-6 flex flex-col items-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <p className="text-base font-semibold text-quiz-foreground">Garantia de 7 dias</p>
            <p className="text-sm text-quiz-muted leading-relaxed">
              Se você não ficar satisfeito, devolvemos 100% do seu dinheiro. Sem perguntas, sem burocracia.
            </p>
          </div>
        </div>

        {/* Botão final */}
        <div className="pb-8">
          {renderActivateButton()}
        </div>
      </div>
      </div>
    </div>
  );
};


export default QuizResults;
