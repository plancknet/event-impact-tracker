import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const features = [
  "Scripts ilimitados por mês",
  "Teleprompter profissional",
  "IA treinada para criadores",
  "Curadoria de notícias em tempo real",
  "Suporte prioritário",
  "Novos recursos em primeira mão",
];

export default function Premium() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!user) {
      navigate("/auth?mode=signup&redirect=/premium");
      return;
    }

    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke("create-subscription-checkout", {
        headers: {
          Authorization: `Bearer ${sessionData.session?.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar sessão de pagamento");
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <img
            src="/imgs/TAT_Logo_sem_fundo_500px.png"
            alt="ThinkAndTalk"
            className="h-8"
          />
          <div className="w-20" />
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Desbloqueie todo o potencial</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Torne-se um criador{" "}
            <span className="text-primary">profissional</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Crie roteiros personalizados com IA, acesse notícias em tempo real e 
            transforme suas ideias em conteúdo de qualidade.
          </p>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="pb-16 md:pb-24">
        <div className="container mx-auto px-4 flex justify-center">
          <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">ThinkAndTalk Pro</CardTitle>
              <CardDescription className="text-base">
                Tudo que você precisa para criar conteúdo incrível
              </CardDescription>
              <div className="mt-6">
                <span className="text-5xl font-bold text-foreground">R$ 29</span>
                <span className="text-2xl font-medium text-muted-foreground">,99</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent className="pb-8">
              <ul className="space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                size="lg"
                className="w-full text-lg h-14"
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  "Assinar agora"
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Cancele a qualquer momento. Sem compromisso.
              </p>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Pagamento seguro processado por Stripe</p>
        </div>
      </footer>
    </div>
  );
}
