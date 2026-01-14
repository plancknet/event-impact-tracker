import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const authSchema = z
  .object({
    mode: z.enum(["login", "signup"]),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.mode !== "signup") return;
    if (!data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Confirme a senha.",
      });
      return;
    }
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "As senhas não conferem.",
      });
    }
  });

type AuthFormData = z.infer<typeof authSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") || "/";
  const mode = params.get("mode");
  const isTrialSignup = mode === "signup" && redirectTo.includes("resume=1");

  const signInWithGoogle = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        setError(error.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      mode: "login",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (mode === "signup") {
      setIsLogin(false);
    }
  }, [mode]);

  useEffect(() => {
    form.setValue("mode", isLogin ? "login" : "signup");
    if (isLogin) {
      form.clearErrors("confirmPassword");
    }
  }, [isLogin, form]);

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo]);

  const onSubmit = async (data: AuthFormData) => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            setError("Email ou senha incorretos.");
          } else {
            setError(error.message);
          }
        }
      } else {
        const { error } = await signUp(data.email, data.password);
        if (error) {
          if (error.message.includes("User already registered")) {
            setError("Este email já está cadastrado. Faça login.");
          } else {
            setError(error.message);
          }
        } else {
          const { error: signInError } = await signIn(data.email, data.password);
          if (signInError) {
            setError("Conta criada, mas não foi possível entrar automaticamente.");
            return;
          }
          setSuccessMessage("Conta criada com sucesso!");
          navigate(redirectTo, { replace: true });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage(null);
    form.reset();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isTrialSignup) {
    return (
      <div className="min-h-screen bg-[#f7f9fc] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <h1 className="text-center text-3xl font-semibold text-blue-700 md:text-4xl">
            Crie agora sua <span className="text-emerald-500">conta</span> e obtenha seu{" "}
            <span className="text-emerald-500">roteiro</span>
          </h1>
          <Card className="w-full border border-slate-100 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
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
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isLogin && (
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  {successMessage && (
                    <p className="text-sm text-primary text-center">{successMessage}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Criar conta
                  </Button>
                </form>
              </Form>
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
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-sky-500 to-emerald-400 text-white">
              <span className="text-base font-bold">T</span>
            </div>
            <span className="text-xl font-semibold text-blue-800">ThinkAndTalk</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
            <button className="hover:text-slate-900">Planos</button>
            <button className="hover:text-slate-900">Recursos</button>
            <button className="flex items-center gap-2 hover:text-slate-900">Português</button>
          </nav>
          <Button
            className="rounded-full bg-blue-600 px-6 hover:bg-blue-700"
            onClick={() => navigate("/?trial=1")}
          >
            Testar Grátis
          </Button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 px-4 py-12 md:grid-cols-[1.2fr_1fr] md:py-16">
        <section className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight text-blue-700 md:text-5xl">
            Crie <span className="text-emerald-500">Roteiros</span> para{" "}
            <span className="text-emerald-500">Vídeos</span> em segundos.
          </h1>
          <p className="text-base text-slate-600 md:text-lg">
            Centralize suas ideias e transforme pensamentos em falas naturais para vídeos,
            podcasts e apresentações.
          </p>
          <p className="text-base text-slate-600 md:text-lg">
            Crie scripts personalizados para YouTube, Instagram, TikTok, Reels, Shorts,
            Lives e muito mais — adaptados ao seu público, tom de voz e objetivo. Rode o
            texto em um teleprompter com ajustes fino.
          </p>
        </section>

        <section className="flex justify-center md:justify-end">
          <Card className="w-full max-w-md border border-slate-100 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.4)]">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {isLogin ? "Entrar" : "Criar conta"}
              </CardTitle>
              <CardDescription>
                {isLogin
                  ? "Entre com sua conta para continuar"
                  : "Crie uma conta para começar"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
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
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!isLogin && (
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  {successMessage && (
                    <p className="text-sm text-primary text-center">{successMessage}</p>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isLogin ? "Entrar" : "Criar conta"}
                  </Button>
                </form>
              </Form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  ou
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={signInWithGoogle}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                Continuar com Google
              </Button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {isLogin
                    ? "Não tem conta? Criar conta"
                    : "Já tem conta? Entrar"}
                </button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
