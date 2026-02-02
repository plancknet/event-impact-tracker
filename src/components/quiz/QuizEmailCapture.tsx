import { useState } from "react";
import { Mail, ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuizEmailCaptureProps {
  onSubmit: (email: string) => void;
}

const QuizEmailCapture = ({ onSubmit }: QuizEmailCaptureProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Por favor, insira seu email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Por favor, insira um email válido");
      return;
    }

    setIsLoading(true);
    
    // Simulate a brief delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSubmit(email);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 animate-slide-in-right">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-quiz-blue/20 to-quiz-purple/20 flex items-center justify-center animate-scale-up-card">
          <Mail className="h-10 w-10 text-quiz-purple" />
        </div>

        {/* Header */}
        <div className="space-y-3 animate-stagger-fade" style={{ animationDelay: "100ms" }}>
          <h2 className="text-2xl font-semibold text-quiz-foreground">
            Quase lá! 🎉
          </h2>
          <p className="text-quiz-muted">
            Insira seu email para receber seu plano personalizado e garantir o desconto de 40%
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4 animate-stagger-fade" style={{ animationDelay: "200ms" }}>
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-quiz-muted" />
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                className="h-14 pl-12 text-base bg-quiz-card border-quiz-border rounded-xl focus:border-quiz-purple focus:ring-quiz-purple"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 text-left">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01]"
          >
            {isLoading ? (
              "Processando..."
            ) : (
              <>
                Ver meu resultado
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>

        {/* Privacy Note */}
        <div className="flex items-center gap-2 text-sm text-quiz-muted animate-stagger-fade" style={{ animationDelay: "300ms" }}>
          <Shield className="h-4 w-4" />
          <span>Seus dados estão seguros. Sem spam.</span>
        </div>
      </div>
    </div>
  );
};

export default QuizEmailCapture;
