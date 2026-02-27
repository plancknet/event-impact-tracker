import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import { QUIZ_QUESTIONS } from "@/components/quiz/quizData";
import { QuizQuestionData } from "@/components/quiz/quizTypes";
import { NewsGrid } from "@/components/script/NewsGrid";
import { TeleprompterDisplay, DEFAULT_TELEPROMPTER_SETTINGS } from "@/components/teleprompter/TeleprompterDisplay";
import { generateTeleprompterScript } from "@/services/teleprompter/generateTeleprompterScript";
import { useUserNews } from "@/hooks/useUserNews";
import { useToast } from "@/hooks/use-toast";

type DemoStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const stepNameQuestion: QuizQuestionData = {
  key: "demo_name",
  question: "Qual o seu nome?",
  freeText: true,
  freeTextPlaceholder: "Digite seu nome",
  options: [],
};

const stepOneQuestion: QuizQuestionData = {
  key: "demo_topic",
  question: "Sobre o que você quer falar hoje?",
  freeText: true,
  freeTextPlaceholder: "Digite o assunto do seu vídeo",
  options: [],
};

const speakingToneQuestion: QuizQuestionData =
  QUIZ_QUESTIONS.find((question) => question.key === "speaking_tone") || {
    key: "speaking_tone",
    question: "Qual é o tom da sua fala nos vídeos?",
    options: [],
  };

const toneMap: Record<string, string> = {
  professional: "profissional",
  friendly: "conversacional",
  motivational: "inspirador",
  fun: "humoristico",
  direct: "jornalistico",
};

export default function Demo() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<DemoStep>(0);
  const [userName, setUserName] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const fetchedTopicRef = useRef<string | null>(null);

  const {
    newsItems,
    isLoading: isLoadingNews,
    error: newsError,
    fetchAndSaveNews,
  } = useUserNews();

  const selectedNews = useMemo(
    () => newsItems.filter((item) => selectedNewsIds.includes(item.id)),
    [newsItems, selectedNewsIds],
  );

  const handleStepBack = () => {
    if (step <= 0) return;
    setStep((previous) => (previous - 1) as DemoStep);
  };

  useEffect(() => {
    if (step !== 2) return;
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;
    if (fetchedTopicRef.current === trimmedTopic) return;
    fetchedTopicRef.current = trimmedTopic;
    void fetchAndSaveNews(trimmedTopic, "pt-BR");
  }, [step, topic, fetchAndSaveNews]);

  useEffect(() => {
    if (step !== 4) return;
    if (isGenerating || generatedScript) return;

    const generate = async () => {
      if (!topic.trim() || !tone || selectedNews.length < 2) {
        setStep(2);
        return;
      }

      setIsGenerating(true);
      try {
        const { script } = await generateTeleprompterScript(
          selectedNews.map((item) => ({
            id: item.id,
            title: item.title,
            summary: item.summary,
            content: item.summary,
          })),
          {
            tone: toneMap[tone] || "conversacional",
            audience: "publico_geral",
            audienceAgeMin: 18,
            audienceAgeMax: 65,
            audienceGenderSplit: 50,
            language: "Portuguese",
            duration: "1",
            durationUnit: "minutes",
            scriptType: "video_curto",
            includeCta: true,
            profile: {
              mainSubject: topic.trim(),
              goal: "informar",
              platform: "YouTube",
            },
            complementaryPrompt: `Tema principal: ${topic.trim()}. O apresentador se chama ${userName.trim()} — use o nome dele(a) na abertura do roteiro.`,
          },
          {
            allowGuest: true,
          },
        );

        if (!script) {
          throw new Error("Empty script");
        }
        setGeneratedScript(script);
        setStep(5);
      } catch (error) {
        console.error("Failed to generate demo script:", error);
        toast({
          title: "Não foi possível gerar o roteiro",
          description: "Tente novamente em instantes.",
          variant: "destructive",
        });
        setStep(3);
      } finally {
        setIsGenerating(false);
      }
    };

    void generate();
  }, [step, isGenerating, generatedScript, selectedNews, topic, tone, toast]);

  if (step === 6) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <TeleprompterDisplay
          script={generatedScript}
          settings={DEFAULT_TELEPROMPTER_SETTINGS}
          onBack={() => setStep(7)}
          autoEnableRecording
          autoRecordOnPlay
          onScriptComplete={() => setStep(7)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quiz-background">
      <header className="border-b bg-quiz-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-3 py-2.5 sm:px-4 sm:py-4 flex items-center gap-2 sm:gap-3">
          <img
            src="/imgs/ThinkAndTalk.png"
            alt="ThinkAndTalk"
            className="h-7 sm:h-8 w-auto"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
          {step > 0 ? (
            <button
              type="button"
              onClick={handleStepBack}
              className="inline-flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-quiz-border/60 text-quiz-muted hover:text-quiz-foreground hover:border-quiz-purple/40 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>

      {step === 0 && (
        <div className="space-y-0">
          <div className="container max-w-3xl mx-auto px-4 pt-6 sm:pt-8 pb-0 text-center">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-quiz-foreground leading-tight">
              Vamos iniciar a demonstração do aplicativo ThinkAndTalk. Em menos de 3 minutos você terá um vídeo pronto!
            </h1>
          </div>
          <QuizQuestion
            question={stepNameQuestion}
            currentIndex={0}
            totalQuestions={7}
            onAnswer={(_, value) => {
              const name = String(value || "").trim();
              if (!name) return;
              setUserName(name);
              setStep(1);
            }}
            selectedAnswer={userName}
            slideDirection="left"
          />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-0">
          <div className="container max-w-3xl mx-auto px-4 pt-6 sm:pt-8 pb-0 text-center">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-quiz-foreground leading-tight">
              Vamos iniciar a demonstração do aplicativo ThinkAndTalk. Em menos de 3 minutos você terá um vídeo pronto!
            </h1>
          </div>
          <QuizQuestion
            question={stepOneQuestion}
            currentIndex={1}
            totalQuestions={7}
            onAnswer={(_, value) => {
              const nextTopic = String(value || "").trim();
              if (!nextTopic) return;
              setTopic(nextTopic);
              setSelectedNewsIds([]);
              setGeneratedScript("");
              fetchedTopicRef.current = null;
              setStep(2);
            }}
            selectedAnswer={topic}
            slideDirection="left"
          />
        </div>
      )}

      {step === 2 && (
        <main className="container max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
          <div className="rounded-xl sm:rounded-2xl border bg-card p-4 sm:p-6 md:p-8 space-y-1.5 sm:space-y-2">
            <h1 className="text-lg sm:text-2xl md:text-3xl font-semibold text-quiz-foreground">
              Selecione ao menos 2 notícias vão guiar o conteúdo do vídeo
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tema: <span className="font-medium text-foreground">{topic}</span>
            </p>
          </div>

          <NewsGrid
            newsItems={newsItems}
            isLoading={isLoadingNews}
            error={newsError}
            selectedIds={selectedNewsIds}
            onSelectionChange={setSelectedNewsIds}
            onRefresh={() => void fetchAndSaveNews(topic, "pt-BR")}
          />

          <Button
            size="lg"
            onClick={() => setStep(3)}
            disabled={selectedNewsIds.length < 2 || isLoadingNews}
            className="w-full sm:w-auto sm:ml-auto sm:flex"
          >
            Avançar
          </Button>
        </main>
      )}

      {step === 3 && (
        <QuizQuestion
          question={speakingToneQuestion}
          currentIndex={2}
          totalQuestions={6}
          onAnswer={(_, value) => {
            setTone(String(value));
            setStep(4);
          }}
          selectedAnswer={tone}
          slideDirection="left"
        />
      )}

      {step === 4 && (
        <main className="container max-w-3xl mx-auto px-4 py-10 sm:py-20">
          <div className="rounded-xl sm:rounded-2xl border bg-card p-6 sm:p-10 text-center space-y-3 sm:space-y-4">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-spin" />
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Gerando seu roteiro...</h2>
            <p className="text-sm text-muted-foreground">
              Estamos cruzando o assunto, as notícias e o estilo da fala para montar sua demonstração.
            </p>
            {isGenerating ? (
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium">Só vai levar alguns segundos. Aguarde...</p>
            ) : null}
          </div>
        </main>
      )}

      {step === 5 && (
        <main className="relative min-h-[calc(100vh-57px)] sm:min-h-[calc(100vh-81px)] overflow-hidden">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 opacity-30 text-white">
            <div className="h-full overflow-hidden p-4 sm:p-8 md:p-12">
              <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base md:text-lg">{generatedScript}</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 container max-w-3xl mx-auto px-4 py-8 sm:py-12 md:py-20">
            <div className="rounded-xl sm:rounded-2xl border border-quiz-purple/40 bg-quiz-purple/90 p-5 sm:p-6 md:p-8 text-white space-y-3 sm:space-y-4 shadow-lg shadow-quiz-purple/30">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold leading-tight">
                Pronto... agora é só apertar o PLAY para dar o seu toque especial
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90">
                Se necessário, utilize os controles do teleprompter para aumentar ou diminuir a velocidade de reprodução, a fonte do texto, alterar a cor do fundo, etc.
              </p>
              <Button size="lg" onClick={() => setStep(6)} className="w-full sm:w-auto">
                Vamos lá
              </Button>
            </div>
          </div>
        </main>
      )}
      {step === 7 && (
        <main className="container max-w-3xl mx-auto px-4 py-8 sm:py-12 md:py-20">
          <div className="rounded-xl sm:rounded-2xl border border-quiz-purple/30 bg-gradient-to-br from-card via-card to-quiz-purple/5 p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-6 shadow-lg">
            <div className="space-y-3">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-quiz-foreground leading-tight">
                🎬 E isso foi só o começo!
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                Em poucos passos você criou um vídeo completo — <span className="text-quiz-foreground font-medium">rápido, prático e 100% auxiliado por IA</span>.
              </p>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed">
                Com o <span className="text-quiz-purple font-semibold">ThinkAndTalk</span> você terá total controle. Você pode criar seu próprio texto ou editar o conteúdo gerado pela IA. No teleprompter você poderá personalizar velocidade, fonte, cor de fundo e muito mais.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={() => navigate("/demo/sales")}
                className="w-full sm:w-auto bg-quiz-purple hover:bg-quiz-purple/90 text-white text-base sm:text-lg px-8 py-3 shadow-md shadow-quiz-purple/25"
              >
                🚀 Quero saber mais
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  setStep(0);
                  setUserName("");
                  setTopic("");
                  setTone("");
                  setGeneratedScript("");
                  setSelectedNewsIds([]);
                  fetchedTopicRef.current = null;
                }}
                className="w-full sm:w-auto text-base sm:text-lg px-8 py-3"
              >
                🔄 Quero experimentar de novo
              </Button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
