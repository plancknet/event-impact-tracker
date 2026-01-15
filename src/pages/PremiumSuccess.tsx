import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, ArrowRight, PartyPopper } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId || !user) {
        setVerifying(false);
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        const response = await supabase.functions.invoke("verify-subscription", {
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
          body: { sessionId },
        });

        if (response.data?.success) {
          setVerified(true);
        }
      } catch (error) {
        console.error("Verification error:", error);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, user]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando pagamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 relative">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <PartyPopper className="h-6 w-6 text-warning absolute -top-1 -right-1" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {verified ? "Parabéns!" : "Obrigado!"}
          </CardTitle>
          <CardDescription className="text-base">
            {verified
              ? "Sua assinatura foi ativada com sucesso!"
              : "Seu pagamento está sendo processado."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            {verified
              ? "Você agora tem acesso a todos os recursos do ThinkAndTalk Pro. Comece a criar conteúdo incrível!"
              : "Em alguns instantes você terá acesso a todos os recursos premium."}
          </p>
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate("/")}
          >
            Começar a usar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
