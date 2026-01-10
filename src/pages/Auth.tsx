import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type AuthMode = "login" | "signup" | "reset";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/", { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast({ title: "Informe um email valido.", variant: "destructive" });
      return;
    }

    if (mode !== "reset" && !password.trim()) {
      toast({ title: "Informe uma senha.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast({ title: "Conta criada. Verifique seu email se necessario." });
        navigate("/", { replace: true });
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        toast({ title: "Link de redefinicao enviado." });
        setMode("login");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Nao foi possivel autenticar.",
        description: error?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Nao foi possivel iniciar o login.",
        description: error?.message ?? "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === "signup" ? "Criar conta" : mode === "reset" ? "Redefinir senha" : "Entrar"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full mb-4"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            Entrar com Google
          </Button>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </div>
            {mode !== "reset" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Sua senha"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : mode === "signup" ? "Criar conta" : mode === "reset" ? "Enviar link" : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 flex flex-col gap-2 text-sm">
            {mode !== "reset" && (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              >
                {mode === "signup" ? "Ja tem conta? Entrar" : "Criar nova conta"}
              </button>
            )}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "reset" ? "login" : "reset")}
            >
              {mode === "reset" ? "Voltar ao login" : "Esqueci minha senha"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
