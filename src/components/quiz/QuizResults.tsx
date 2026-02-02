import {
  Star,
  CheckCircle,
  Target,
  Zap,
  ArrowRight,
  Lightbulb,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuizAnswers } from "@/pages/Quiz";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface QuizResultsProps {
  answers: QuizAnswers;
  quizResponseId?: string;
}

const getProfileAnalysis = (answers: QuizAnswers) => {
  let profileName = "Criador em Evolução";
  let strengths: string[] = [];
  let mainChallenge = "";
  let recommendation = "";

  switch (answers.creator_level) {
    case "beginner":
      profileName = "Criador Iniciante";
      break;
    case "basic":
      profileName = "Criador em Desenvolvimento";
      break;
    case "intermediate":
      profileName = "Criador Consistente";
      break;
    case "advanced":
      profileName = "Criador Profissional";
      break;
  }

  const nicheMap: Record<string, string> = {
    education: "de Educação",
    business: "de Negócios",
    lifestyle: "de Lifestyle",
    health: "de Saúde",
    entertainment: "de Entretenimento",
  };
  if (answers.niche && nicheMap[answers.niche]) {
    profileName += ` ${nicheMap[answers.niche]}`;
  }

  if (answers.comfort_recording === "very_comfortable") {
    strengths.push("Confiança ao falar para câmera");
  }
  if (answers.planning_style === "full_scripts") {
    strengths.push("Planejamento estruturado");
  }
  if (answers.publish_frequency === "daily" || answers.publish_frequency === "3_5_weekly") {
    strengths.push("Consistência na publicação");
  }
  if (answers.speaking_tone) {
    const toneMap: Record<string, string> = {
      professional: "Tom profissional e autoridade",
      friendly: "Comunicação acessível",
      motivational: "Capacidade de inspirar",
      fun: "Carisma e leveza",
      direct: "Objetividade",
    };
    if (toneMap[answers.speaking_tone]) {
      strengths.push(toneMap[answers.speaking_tone]);
    }
  }

  if (strengths.length === 0) {
    strengths = ["Vontade de aprender", "Disposição para crescer"];
  }

  const challengeMap: Record<string, string> = {
    lack_ideas: "Geração de ideias de conteúdo",
    poor_editing: "Habilidades de edição",
    no_engagement: "Engajamento da audiência",
    shyness: "Confiança ao gravar",
  };
  mainChallenge = answers.biggest_challenge
    ? challengeMap[answers.biggest_challenge] || "Encontrar seu fluxo criativo"
    : "Estruturar sua produção de vídeos";

  if (answers.biggest_challenge === "lack_ideas" || answers.planning_style === "no_script") {
    recommendation = "Roteiros inteligentes gerados por IA para nunca mais faltar ideias";
  } else if (answers.biggest_challenge === "shyness" || answers.comfort_recording === "avoid") {
    recommendation = "Teleprompter com IA para gravar com mais fluidez e confiança";
  } else if (answers.editing_time === "more_2h" || answers.editing_time === "1_2h") {
    recommendation = "Roteiros prontos para reduzir drasticamente seu tempo de produção";
  } else {
    recommendation = "Plano personalizado para elevar a qualidade dos seus vídeos";
  }

  return { profileName, strengths, mainChallenge, recommendation };
};

const QuizResults = ({ answers, quizResponseId }: QuizResultsProps) => {
  const { profileName, strengths, mainChallenge, recommendation } = getProfileAnalysis(answers);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleActivatePlan = async () => {
    setIsLoading(true);
    try {
      // Get session if user is logged in, but don't require it
      const { data: sessionData } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("create-subscription-checkout", {
        headers: sessionData.session?.access_token
          ? { Authorization: `Bearer ${sessionData.session.access_token}` }
          : {},
        body: { quizResponseId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao iniciar assinatura");
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

  return (
    <div className="min-h-screen flex flex-col px-4 py-8 sm:px-6 animate-fade-in">
      <div className="w-full max-w-lg mx-auto flex flex-col space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-quiz-selected rounded-full text-quiz-purple font-medium text-sm">
            <Target className="h-4 w-4" />
            Análise Completa
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-quiz-foreground">
            ThinkAndTalk personalizado para seu perfil
          </h1>
        </div>
        <div className="bg-gradient-to-br from-quiz-blue/10 to-quiz-purple/10 rounded-2xl p-6 border border-quiz-purple/20 space-y-4">
          <p className="text-quiz-foreground leading-relaxed">
            Criamos um aplicativo com um plano sob medida para você criar vídeos com mais clareza, confiança e consistência usando roteiros inteligentes e teleprompter com IA.
          </p>

          <div className="flex items-center justify-center gap-2 text-quiz-purple font-semibold">
            <span className="line-through text-quiz-muted text-sm">R$ 49,90/mês</span>
            <span className="text-xl">R$ 29,90/mês</span>
            <span className="bg-quiz-purple text-white text-xs px-2 py-1 rounded-full">-40%</span>
          </div>

          <Button
            onClick={handleActivatePlan}
            size="lg"
            disabled={isLoading}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-quiz-blue to-quiz-purple hover:opacity-90 transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                Ativar meu aplicativo personaliado
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        <div className="text-center space-y-3 pb-8">
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-quiz-muted">
            Criadores de conteúdo já usam o ThinkAndTalk para gravar melhor e mais rápido
          </p>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
