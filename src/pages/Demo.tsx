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

type DemoStep = 1 | 2 | 3 | 4 | 5 | 6;

const stepOneQuestion: QuizQuestionData = {
  key: "demo_topic",
  question: "Sobre que o que quer falar hoje?",
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
  const [step, setStep] = useState<DemoStep>(1);
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
    if (step <= 1) return;
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
            duration: "3",
            durationUnit: "minutes",
            scriptType: "video_curto",
            includeCta: true,
            profile: {
              mainSubject: topic.trim(),
              goal: "informar",
              platform: "YouTube",
            },
            complementaryPrompt: `Tema principal: ${topic.trim()}`,
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
          onBack={() => navigate("/quiz/sales")}
          autoEnableRecording
          autoRecordOnPlay
          onScriptComplete={() => navigate("/quiz/sales")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-quiz-background">
      <header className="border-b bg-quiz-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/imgs/ThinkAndTalk.png"
              alt="ThinkAndTalk"
              className="h-8 w-auto"
              loading="eager"
              decoding="async"
              fetchPriority="high"
            />
            {step > 1 ? (
              <button
                type="button"
                onClick={handleStepBack}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-quiz-border/60 text-quiz-muted hover:text-quiz-foreground hover:border-quiz-purple/40 transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="hidden md:block w-[240px]">
            <div className="h-1.5 bg-quiz-border/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-500 ease-out rounded-full"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {step === 1 && (
        <QuizQuestion
          question={stepOneQuestion}
          currentIndex={0}
          totalQuestions={6}
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
      )}

      {step === 2 && (
        <main className="container max-w-6xl mx-auto px-4 py-8 space-y-6">
          <div className="rounded-2xl border bg-card p-6 md:p-8 space-y-2">
            <h1 className="text-xl md:text-2xl font-semibold text-quiz-foreground">
              Selecione ao menos 2 notícias vão guiar o conteúdo do vídeo
            </h1>
            <p className="text-sm text-muted-foreground">
              Tema da demonstração: <span className="font-medium text-foreground">{topic}</span>
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

          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={() => setStep(3)}
              disabled={selectedNewsIds.length < 2 || isLoadingNews}
            >
              Avançar
            </Button>
          </div>
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
        <main className="container max-w-3xl mx-auto px-4 py-20">
          <div className="rounded-2xl border bg-card p-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Gerando seu roteiro...</h2>
            <p className="text-muted-foreground">
              Estamos cruzando o assunto, as notícias e o estilo da fala para montar sua demonstração.
            </p>
            {isGenerating ? (
              <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
            ) : null}
          </div>
        </main>
      )}

      {step === 5 && (
        <main className="relative min-h-[calc(100vh-81px)] overflow-hidden">
          <div className="absolute inset-0 bg-black" />
          <div className="absolute inset-0 opacity-30 text-white">
            <div className="h-full overflow-hidden p-8 md:p-12">
              <p className="whitespace-pre-wrap leading-relaxed text-base md:text-lg">{generatedScript}</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 container max-w-3xl mx-auto px-4 py-12 md:py-20">
            <div className="rounded-2xl border border-white/20 bg-black/70 p-6 md:p-8 text-white space-y-4">
              <h1 className="text-2xl md:text-3xl font-semibold">
                Pronto... agora é só apertar o PLAY para dar o seu toque especial
              </h1>
              <p className="text-white/90">
                Se necessário, utilize os comandos para aumentar ou diminiur a velocidade de reprodução, a fonte do texto, alterar a cor do fundo, etc.
              </p>
              <Button size="lg" onClick={() => setStep(6)}>
                Vamos lá
              </Button>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
