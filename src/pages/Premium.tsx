import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type PlanType = "STANDARD" | "INFLUENCER";

type UserProfile = {
  subscription_tier?: string | null;
  subscription_status?: string | null;
  plan_confirmed?: boolean | null;
};

export default function Premium() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("subscription_tier, subscription_status, plan_confirmed")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data || {});
      } catch (error: any) {
        toast({
          title: "Nao foi possivel carregar o plano.",
          description: error?.message ?? "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate, toast]);

  const startCheckout = async (planType: PlanType) => {
    setCheckoutLoading(planType);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { planType },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast({
        title: "Nao foi possivel iniciar o pagamento.",
        description: error?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isStandard = profile?.subscription_tier === "STANDARD";
  const isInfluencer = profile?.subscription_tier === "INFLUENCER";
  const influencerPastDue = profile?.subscription_status === "past_due";

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">Planos</p>
          <h1 className="text-3xl font-semibold">Escolha seu plano</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className={isStandard ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Standard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Pagamento unico para acesso completo.</p>
              <Button
                className="w-full"
                onClick={() => startCheckout("STANDARD")}
                disabled={checkoutLoading === "STANDARD"}
              >
                {isStandard ? "Plano atual" : checkoutLoading === "STANDARD" ? "Redirecionando..." : "Assinar"}
              </Button>
            </CardContent>
          </Card>

          <Card className={isInfluencer ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Influencer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">Assinatura com recursos extras.</p>
              <Button
                className="w-full"
                variant={influencerPastDue ? "destructive" : "default"}
                onClick={() => startCheckout("INFLUENCER")}
                disabled={checkoutLoading === "INFLUENCER"}
              >
                {isInfluencer && !influencerPastDue
                  ? "Plano atual"
                  : checkoutLoading === "INFLUENCER"
                    ? "Redirecionando..."
                    : "Assinar"}
              </Button>
              {influencerPastDue && (
                <p className="text-sm text-destructive">Pagamento pendente. Atualize seu metodo de pagamento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
