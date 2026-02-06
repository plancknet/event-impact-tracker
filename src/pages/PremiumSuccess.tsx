import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n";

export default function PremiumSuccess() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [verifying, setVerifying] = useState(true);
  const [activated, setActivated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyLicense = async () => {
      if (!user || authLoading) {
        setVerifying(false);
        return;
      }

      setVerifying(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await supabase.functions.invoke("lastlink-verify", {
          headers: {
            Authorization: `Bearer ${sessionData.session?.access_token}`,
          },
        });

        if (response.error) {
          console.error("Lastlink verify error:", response.error);
          setError("Erro ao verificar pagamento. Tente novamente.");
          setActivated(false);
          return;
        }

        if (response.data?.activated) {
          setActivated(true);
          setError(null);
        } else {
          setActivated(false);
        }
      } catch (err) {
        console.error("License verification error:", err);
        setError("Erro ao verificar pagamento. Tente novamente.");
      } finally {
        setVerifying(false);
      }
    };

    void verifyLicense();
  }, [user, authLoading]);

  // Still loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("Carregando...")}</p>
        </div>
      </div>
    );
  }

  // User not logged in - need to login first
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="pb-4">
            <div className="mx-auto mb-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {t("Pagamento confirmado!")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("Faça login para acessar sua conta.")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-xl text-primary">
                {t("Use o email que você cadastrou no quiz e a senha padrão: 12345678")}
              </span>
            </p>
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => navigate("/auth?redirect=/studio")}
            >
              {t("Fazer login")}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Activating license
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t("Verificando pagamento...")}</p>
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
            {t("Parabéns!")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("Sua licença foi ativada com sucesso!")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">
            {t("Você agora tem acesso a todos os recursos do ThinkAndTalk Pro. Comece a criar conteúdo incrível!")}
          </p>
          <Button
            size="lg"
            className="w-full gap-2"
            onClick={() => navigate(activated ? "/" : "/premium/success")}
          >
            {t("Começar a criar")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
