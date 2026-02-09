import {
  Star,
  Target,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
  const { toast } = useToast();

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
          Ativar meu aplicativo personalizado
          <ArrowRight className="h-5 w-5 flex-shrink-0" />
        </span>
      )}
    </Button>
  );

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 sm:px-6 animate-slide-in-right">
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
            <span className="text-xl">R$ 47</span>
            <span className="bg-quiz-purple text-white text-xs px-2 py-1 rounded-full">-40%</span>
            <span className="text-xs text-quiz-muted font-medium">pagamento único</span>
          </div>

          {renderActivateButton()}
        </div>

        {/* Prova Social */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "180ms" }}>
          <h2 className="text-lg font-semibold text-quiz-foreground">Prova social</h2>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-quiz-muted">Avaliacoes</p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-base font-semibold text-quiz-foreground">4.9/5</span>
                <span className="text-sm text-quiz-muted">98% de Satisfacao</span>
              </div>
            </div>
            <div className="space-y-3 text-sm text-quiz-foreground">
              <p><span className="font-semibold">Maria Souza</span> - Ficou incrivel o resultado.</p>
              <p><span className="font-semibold">Albero Dias</span> - Em menos de 5 minutos ficou pronto. Revolucionario!!!</p>
              <p><span className="font-semibold">Ana Braga</span> - So com o celular eu consegui.</p>
              <p><span className="font-semibold">Carlo Rocha</span> - Economizei tempo e muuuuuita grana. Sensacional!!</p>
            </div>
          </div>
        </div>

        {renderActivateButton()}

        {/* Quebra de objecoes */}
        <div className="space-y-4 animate-stagger-fade" style={{ animationDelay: "260ms" }}>
          <h2 className="text-lg font-semibold text-quiz-foreground">Quebra de objecoes</h2>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
            <p className="text-sm font-semibold text-quiz-purple uppercase tracking-[0.2em]">
              Segredo Revelado
            </p>
            <p className="text-quiz-foreground">
              A mesma tecnica que os grandes criadores de conteudo usam para criar videos.
            </p>
            <div className="space-y-3 text-sm text-quiz-foreground">
              <p><span className="font-semibold">Segredo dos grandes criadores de conteudo</span> - Mesma tecnica utilizada pelos grandes influenciadores</p>
              <p><span className="font-semibold">So precisa do celular</span> - Zero custo com edicao</p>
              <p><span className="font-semibold">Resultado em 5 minutos</span> - Rapidez impressionante</p>
              <p><span className="font-semibold">Sem conhecimento</span> - Qualquer pessoa consegue</p>
            </div>
          </div>
        </div>

        {renderActivateButton()}

        {/* Facilidade de Aplicacao */}
        <div className="space-y-4 pb-8 animate-stagger-fade" style={{ animationDelay: "340ms" }}>
          <h2 className="text-lg font-semibold text-quiz-foreground">Facilidade de Aplicacao</h2>
          <div className="rounded-2xl border border-quiz-border/60 bg-quiz-card/90 p-5 space-y-4">
            <div className="space-y-2 text-sm text-quiz-foreground">
              <p><span className="font-semibold">1</span> - Use o celular</p>
              <p><span className="font-semibold">2</span> - Informe o tema do video</p>
              <p><span className="font-semibold">3</span> - Selecione as noticias recentes</p>
              <p><span className="font-semibold">4</span> - IA Processa</p>
            </div>
            <p className="text-quiz-foreground font-semibold">Pronto - Roteiro no teleprompter profissional</p>
            <div className="pt-2 space-y-2 text-sm text-quiz-foreground">
              <p className="text-sm uppercase tracking-[0.2em] text-quiz-muted">A Solucao Simples</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-quiz-border/50 bg-white/70 px-3 py-2">
                  <p className="text-xs text-quiz-muted">R$ 69,90 - apenas</p>
                </div>
                <div className="rounded-xl border border-quiz-border/50 bg-white/70 px-3 py-2">
                  <p className="text-xs text-quiz-muted">5 minutos - rapido</p>
                </div>
                <div className="rounded-xl border border-quiz-border/50 bg-white/70 px-3 py-2">
                  <p className="text-xs text-quiz-muted">Facil - Qualquer um</p>
                </div>
                <div className="rounded-xl border border-quiz-border/50 bg-white/70 px-3 py-2">
                  <p className="text-xs text-quiz-muted">100% - independente</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default QuizResults;
