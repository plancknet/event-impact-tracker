import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function PremiumSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const sessionId = params.get("session_id");
        if (!sessionId) {
          setStatus("error");
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase.functions.invoke("verify-payment", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: { sessionId },
        });

        if (error) throw error;
        if (data?.success) {
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch (error: any) {
        toast({
          title: "Nao foi possivel confirmar o pagamento.",
          description: error?.message ?? "Tente novamente.",
          variant: "destructive",
        });
        setStatus("error");
      }
    };

    verifyPayment();
  }, [location.search, navigate, toast]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && <p>Confirmando pagamento...</p>}
          {status === "ok" && <p>Pagamento confirmado. Seu plano foi ativado.</p>}
          {status === "error" && <p>Nao foi possivel confirmar o pagamento.</p>}
          <Button onClick={() => navigate("/")} className="w-full">
            Voltar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
