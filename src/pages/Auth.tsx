import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n";
import { LanguageSelector } from "@/components/LanguageSelector";

const DEFAULT_FIRST_ACCESS_PASSWORD = "12345678";

const createAuthSchema = (t: (key: string) => string) =>
  z.object({
    email: z.string().email(t("Email inválido")),
    password: z.string().min(6, t("A senha deve ter pelo menos 6 caracteres")),
  });

type AuthFormData = z.infer<ReturnType<typeof createAuthSchema>>;

export default function Auth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [forcePassword, setForcePassword] = useState("");
  const [forceConfirm, setForceConfirm] = useState("");
  const [forceError, setForceError] = useState<string | null>(null);
  const [forceSuccess, setForceSuccess] = useState<string | null>(null);
  const [forceSubmitting, setForceSubmitting] = useState(false);
  const { user, loading, signIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/";
  const mode = params.get("mode");
  const isForceChange = mode === "force-change";


  const form = useForm<AuthFormData>({
    resolver: zodResolver(createAuthSchema(t)),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!loading && user && !isForceChange) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo, isForceChange]);

  useEffect(() => {
    if (!loading && !user && isForceChange) {
      navigate(`/auth?mode=login&redirect=${encodeURIComponent(redirectTo)}`, { replace: true });
    }
  }, [user, loading, navigate, redirectTo, isForceChange]);

  const handleForcePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForceError(null);
    setForceSuccess(null);

    if (forcePassword.length < 6) {
      setForceError(t("A senha deve ter pelo menos 6 caracteres"));
      return;
    }
    if (forcePassword !== forceConfirm) {
      setForceError(t("As senhas não conferem."));
      return;
    }
    if (forcePassword === DEFAULT_FIRST_ACCESS_PASSWORD) {
      setForceError(t("A nova senha deve ser diferente da senha inicial."));
      return;
    }

    setForceSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: forcePassword,
        data: { must_change_password: false },
      });
      if (updateError) {
        setForceError(updateError.message);
        return;
      }
      setForceSuccess(t("Senha atualizada com sucesso!"));
      navigate(redirectTo, { replace: true });
    } finally {
      setForceSubmitting(false);
    }
  };

  const onSubmit = async (data: AuthFormData) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const { error: signInError } = await signIn(data.email, data.password);
      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          setError(t("Email ou senha incorretos."));
        } else {
          setError(signInError.message);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isForceChange) {
    if (!user) {
      return null;
    }

    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <h1 className="text-center text-2xl font-semibold text-slate-900 md:text-3xl">
            {t("Atualize sua senha para continuar")}
          </h1>
          <Card className="w-full border border-slate-100 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
            <CardContent className="pt-6">
              <form onSubmit={handleForcePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">{t("Nova senha")}</label>
                  <Input
                    type="password"
                    placeholder="******"
                    value={forcePassword}
                    onChange={(event) => setForcePassword(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">{t("Confirmar nova senha")}</label>
                  <Input
                    type="password"
                    placeholder="******"
                    value={forceConfirm}
                    onChange={(event) => setForceConfirm(event.target.value)}
                  />
                </div>

                {forceError && <p className="text-sm text-destructive text-center">{forceError}</p>}
                {forceSuccess && <p className="text-sm text-primary text-center">{forceSuccess}</p>}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={forceSubmitting}
                >
                  {forceSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  {t("Salvar nova senha")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="border-b bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <img
            src="/imgs/ThinkAndTalk.png"
            alt="ThinkAndTalk"
            className="h-8 w-auto sm:h-10"
          />
          <LanguageSelector />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
        <section className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-blue-700 md:text-5xl">
            {t("Crie ")}
            <span className="text-emerald-500">{t("Roteiros")}</span>
            {t(" para ")}
            <span className="text-emerald-500">{t("Vídeos")}</span>
            {t(" em segundos, usando ")}
            <span className="text-emerald-500">{t("IA")}</span>.
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            {t(
              "Crie scripts personalizados para YouTube, Instagram, TikTok, Reels, Shorts, Lives e muito mais — adaptados ao seu público, tom de voz e objetivo. Rode o texto em um teleprompter com ajustes fino."
            )}
          </p>
        </section>

        <section className="flex justify-center md:justify-end">
          <Card className="w-full max-w-md border border-slate-100 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
                {t("Entrar")}
            </CardTitle>
          </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Email")}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Senha")}</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {error && <p className="text-sm text-destructive text-center">{error}</p>}

                  {successMessage && (
                    <p className="text-sm text-primary text-center">{successMessage}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {t("Entrar")}
                  </Button>
                </form>
              </Form>

            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}

