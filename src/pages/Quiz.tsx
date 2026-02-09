import { useState, useEffect, Suspense, lazy } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ArrowLeft, Baby, GraduationCap, Briefcase, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { QuizQuestionData } from "@/components/quiz/quizTypes";
import { DEFAULT_CREATOR_PROFILE } from "@/types/creatorProfile";

const CHECKOUT_URL = "https://lastlink.com/p/C7229FE68/checkout-payment/";

const buildCheckoutUrl = (email?: string) => {
  const url = new URL(CHECKOUT_URL);
  const redirectUrl = `${window.location.origin}/premium/success`;
  url.searchParams.set("redirect_url", redirectUrl);
  if (email) {
    url.searchParams.set("email", email);
    url.searchParams.set("quiz_email", email);
  }
  return url.toString();
};

const QuizTransition = lazy(() => import("@/components/quiz/QuizTransition"));
const QuizCoupon = lazy(() => import("@/components/quiz/QuizCoupon"));
const QuizEmailCapture = lazy(() => import("@/components/quiz/QuizEmailCapture"));
const QuizResults = lazy(() => import("@/components/quiz/QuizResults"));
const QuizAgeHighlight = lazy(() => import("@/components/quiz/QuizAgeHighlight"));
const QuizProcessing = lazy(() => import("@/components/quiz/QuizProcessing"));
const QuizMidMessage = lazy(() => import("@/components/quiz/QuizMidMessage"));

export type QuizStep = 
  | "questions" 
  | "age_highlight"
  | "mid_message"
  | "processing"
  | "transition" 
  | "coupon" 
  | "email" 
  | "results";

export interface QuizAnswers {
  age_range?: string;
  gender?: string;
  main_goal?: string;
  publish_frequency?: string;
  comfort_recording?: string;
  biggest_challenge?: string;
  planning_style?: string;
  editing_time?: string;
  result_goal?: string;
  niche?: string;
  creator_level?: string;
  audience_type?: string;
  audience_age?: string;
  audience_gender?: string;
  video_format?: string;
  video_duration?: string;
  platforms?: string[];
  speaking_tone?: string;
  energy_level?: string;
  content_goal?: string;
}

// Get São Paulo timezone timestamp (UTC-3) as ISO string
const getSaoPauloTimestamp = () => {
  return new Date().toISOString();
};


const mapQuizExpertiseLevel = (level?: string) => {
  switch (level) {
    case "beginner":
      return "iniciante";
    case "basic":
      return "intermediario";
    case "intermediate":
      return "avancado";
    case "advanced":
      return "especialista";
    default:
      return DEFAULT_CREATOR_PROFILE.expertise_level;
  }
};

const mapQuizAudienceType = (audience?: string) => {
  switch (audience) {
    case "b2c":
      return "publico_geral";
    case "entrepreneurs":
      return "empreendedores";
    case "creators":
      return "criadores";
    case "b2b":
      return "profissionais";
    case "general":
      return "publico_geral";
    default:
      return DEFAULT_CREATOR_PROFILE.audience_type;
  }
};

const mapQuizMainTopic = (niche?: string) => {
  switch (niche) {
    case "education":
      return "Educação";
    case "business":
      return "Negócios";
    case "lifestyle":
      return "Lifestyle";
    case "health":
      return "Saúde";
    case "entertainment":
      return "Entretenimento";
    case "other":
      return "Geral";
    default:
      return DEFAULT_CREATOR_PROFILE.main_topic;
  }
};

const mapQuizPlatform = (platforms?: string[]) => {
  if (!platforms || platforms.length === 0) {
    return DEFAULT_CREATOR_PROFILE.platform;
  }
  if (platforms.includes("youtube_long") || platforms.includes("youtube_shorts")) {
    return "YouTube";
  }
  if (platforms.includes("instagram")) {
    return "Instagram";
  }
  if (platforms.includes("tiktok")) {
    return "TikTok";
  }
  if (platforms.includes("lives")) {
    return "YouTube";
  }
  return "YouTube";
};

const mapQuizSpeakingTone = (tone?: string) => {
  switch (tone) {
    case "professional":
      return "profissional";
    case "friendly":
      return "conversacional";
    case "motivational":
      return "inspirador";
    case "fun":
      return "humoristico";
    case "direct":
      return "jornalistico";
    default:
      return DEFAULT_CREATOR_PROFILE.speaking_tone;
  }
};

const mapQuizEnergyLevel = (energy?: string) => {
  switch (energy) {
    case "low":
      return "baixo";
    case "medium":
      return "medio";
    case "high":
      return "alto";
    default:
      return DEFAULT_CREATOR_PROFILE.energy_level;
  }
};

const mapQuizContentGoal = (goal?: string) => {
  switch (goal) {
    case "inform":
      return "informar";
    case "educate":
      return "educar";
    case "entertain":
      return "entreter";
    case "inspire":
      return "inspirar";
    case "sell":
      return "vender";
    case "engage":
      return "engajar";
    default:
      return DEFAULT_CREATOR_PROFILE.content_goal;
  }
};

const mapQuizDuration = (duration?: string) => {
  switch (duration) {
    case "1min":
      return { target_duration: "1", video_type: "video_curto" };
    case "2min":
      return { target_duration: "2", video_type: "video_curto" };
    case "3min":
      return { target_duration: "3", video_type: "video_curto" };
    case "5min":
      return { target_duration: "5", video_type: "video_medio" };
    case "10min_plus":
      return { target_duration: "10", video_type: "video_longo" };
    default:
      return { target_duration: DEFAULT_CREATOR_PROFILE.target_duration, video_type: DEFAULT_CREATOR_PROFILE.video_type };
  }
};

const mapQuizVideoTypeFromFormat = (format?: string) => {
  switch (format) {
    case "educational":
    case "storytelling":
    case "opinion":
      return "video_medio";
    case "behind_scenes":
    case "sales":
      return "video_curto";
    case "mixed":
      return "video_medio";
    default:
      return DEFAULT_CREATOR_PROFILE.video_type;
  }
};

const buildCreatorProfileFromQuiz = (answers: QuizAnswers) => {
  const duration = mapQuizDuration(answers.video_duration);
  const videoType =
    duration.video_type !== DEFAULT_CREATOR_PROFILE.video_type
      ? duration.video_type
      : mapQuizVideoTypeFromFormat(answers.video_format);

  return {
    display_name: null,
    main_topic: mapQuizMainTopic(answers.niche),
    expertise_level: mapQuizExpertiseLevel(answers.creator_level),
    audience_type: mapQuizAudienceType(answers.audience_type),
    audience_pain_points: [],
    video_type: videoType,
    target_duration: duration.target_duration,
    duration_unit: DEFAULT_CREATOR_PROFILE.duration_unit,
    platform: mapQuizPlatform(answers.platforms),
    speaking_tone: mapQuizSpeakingTone(answers.speaking_tone),
    energy_level: mapQuizEnergyLevel(answers.energy_level),
    content_goal: mapQuizContentGoal(answers.content_goal),
    script_language: DEFAULT_CREATOR_PROFILE.script_language,
    news_language: DEFAULT_CREATOR_PROFILE.news_language,
    include_cta: DEFAULT_CREATOR_PROFILE.include_cta,
    cta_template: null,
  };
};

const Quiz = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialStep = searchParams.get("step") === "results" ? "results" : "questions";
  const [step, setStep] = useState<QuizStep>(initialStep);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([
    {
      key: "age_range",
      question: "Quantos anos você tem?",
      options: [
        { value: "under_18", label: "Até 18 anos", icon: Baby },
        { value: "18_24", label: "18-24", icon: GraduationCap },
        { value: "25_34", label: "25-34", icon: Briefcase },
        { value: "35_44", label: "35-44", icon: Users },
        { value: "45_plus", label: "45+", icon: UserCheck },
      ],
    },
  ]);
  const [isQuestionsLoaded, setIsQuestionsLoaded] = useState(false);
  const [pendingAdvance, setPendingAdvance] = useState(false);
  const [ageHighlightNextIndex, setAgeHighlightNextIndex] = useState<number | null>(null);
  const [processingNextIndex, setProcessingNextIndex] = useState<number | null>(null);
  const [midMessageNextIndex, setMidMessageNextIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [email, setEmail] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Create quiz response on start
  const handleStart = async () => {
    const newQuizId = crypto.randomUUID();
    const startTime = getSaoPauloTimestamp();
    
    const { error: quizError } = await supabase
      .from("quiz_responses")
      .insert({ 
        id: newQuizId,
        session_started_at: startTime,
      });

    if (quizError) {
      console.error("Failed to create quiz response:", quizError);
      toast({
        title: "Erro ao iniciar o quiz",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      setQuizId(null);
    } else {
      setQuizId(newQuizId);
    }
    setStep(initialStep);
  };

  useEffect(() => {
    void handleStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let active = true;
    import("@/components/quiz/quizData")
      .then((module) => {
        if (!active) return;
        setQuestions(module.QUIZ_QUESTIONS);
        setIsQuestionsLoaded(true);
      })
      .catch((error) => {
        console.error("Failed to load quiz questions:", error);
      });
    return () => {
      active = false;
    };
  }, []);

  // Save answer and advance with timestamp tracking
  const handleAnswer = async (questionKey: string, value: string | string[]) => {
    const newAnswers = { ...answers, [questionKey]: value };
    setAnswers(newAnswers);
    
    const timestamp = getSaoPauloTimestamp();
    const timestampKey = `${questionKey}_at`;

    // Save to database with dedicated timestamp column
    if (quizId) {
      // Build update object with explicit keys
      const updateData: Record<string, unknown> = {};
      updateData[questionKey] = value;
      updateData[timestampKey] = timestamp;
      
      console.log("Updating quiz response:", { quizId, questionKey, value, timestamp });
      
      const { data, error } = await supabase
        .from("quiz_responses")
        .update(updateData)
        .eq("id", quizId)
        .select();
      
      if (error) {
        console.error("Failed to update quiz response:", error);
      } else {
        console.log("Quiz response updated successfully:", data);
      }
    }

    // Auto-advance with animation (wait for DB update to complete first)
    setSlideDirection("left");
    
    setTimeout(() => {
      if (questionKey === "main_goal") {
        setAgeHighlightNextIndex(currentQuestion + 1);
        setStep("age_highlight");
        return;
      }

      if (questionKey === "audience_gender") {
        setMidMessageNextIndex(currentQuestion + 1);
        setStep("mid_message");
        return;
      }

      if (currentQuestion === 6) {
        setProcessingNextIndex(currentQuestion + 1);
        setStep("processing");
        return;
      }

      const nextIndex = currentQuestion + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestion(nextIndex);
        return;
      }
      if (!isQuestionsLoaded) {
        setPendingAdvance(true);
        return;
      }
      setStep("transition");
    }, 300);
  };

  const handleTransitionComplete = async () => {
    if (quizId) {
      try {
        await supabase
          .from("quiz_responses")
          .update({ transition_complete_at: getSaoPauloTimestamp() })
          .eq("id", quizId)
          .select();
      } catch (err) {
        console.error("Transition complete update error:", err);
      }
    }
    setStep("coupon");
  };

  const handleCouponRevealed = async () => {
    if (quizId) {
      try {
        await supabase
          .from("quiz_responses")
          .update({ 
            coupon_revealed: true,
            coupon_revealed_at: getSaoPauloTimestamp(),
          })
          .eq("id", quizId)
          .select();
      } catch (err) {
        console.error("Coupon reveal update error:", err);
      }
    }
    setStep("email");
  };

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    const completedAt = getSaoPauloTimestamp();
    
    // Save email to quiz_responses - user creation happens only after payment via webhook
    if (quizId) {
      try {
        await supabase
          .from("quiz_responses")
          .update({ 
            email: submittedEmail,
            completed_at: completedAt,
            reached_results: true,
          })
          .eq("id", quizId)
          .select();
      } catch (err) {
        console.error("Email submit update error:", err);
      }
    }

    // Store draft profile for use after login (post-payment)
    const creatorProfilePayload = buildCreatorProfileFromQuiz(answers);
    sessionStorage.setItem("draftCreatorProfile", JSON.stringify(creatorProfilePayload));
    sessionStorage.setItem("pendingQuizEmail", submittedEmail);
    
    setStep("results");
  };

  const handleActivatePlan = () => {
    if (authLoading) {
      toast({
        title: "Aguardando autenticação",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    if (!user) {
      navigate("/auth?mode=signup&redirect=/premium");
      return;
    }

    const startCheckout = async () => {
      setIsCheckoutLoading(true);
      try {
        const preferredEmail = email || sessionStorage.getItem("pendingQuizEmail") || undefined;
        window.location.href = buildCheckoutUrl(preferredEmail || undefined);
      } catch (error: unknown) {
        console.error("Subscription error:", error);
        toast({
          title: "Erro ao iniciar assinatura",
          description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
          variant: "destructive",
        });
      } finally {
        setIsCheckoutLoading(false);
      }
    };

    void startCheckout();
  };

  const handleBackQuestion = () => {
    if (currentQuestion <= 0) return;
    setSlideDirection("right");
    setCurrentQuestion((prev) => Math.max(0, prev - 1));
  };

  const handleAgeHighlightContinue = () => {
    if (ageHighlightNextIndex !== null && ageHighlightNextIndex < questions.length) {
      setCurrentQuestion(ageHighlightNextIndex);
      setStep("questions");
      setAgeHighlightNextIndex(null);
      return;
    }
    if (!isQuestionsLoaded) {
      setPendingAdvance(true);
      setStep("questions");
      return;
    }
    setStep("transition");
  };

  const handleMidMessageContinue = () => {
    if (midMessageNextIndex !== null && midMessageNextIndex < questions.length) {
      setCurrentQuestion(midMessageNextIndex);
      setStep("questions");
      setMidMessageNextIndex(null);
      return;
    }
    if (!isQuestionsLoaded) {
      setPendingAdvance(true);
      setStep("questions");
      return;
    }
    setStep("transition");
  };

  const handleProcessingComplete = () => {
    if (processingNextIndex !== null && processingNextIndex < questions.length) {
      setCurrentQuestion(processingNextIndex);
      setStep("questions");
      setProcessingNextIndex(null);
      return;
    }
    if (!isQuestionsLoaded) {
      setPendingAdvance(true);
      setStep("questions");
      return;
    }
    setStep("transition");
  };

  useEffect(() => {
    if (!pendingAdvance || !isQuestionsLoaded) return;
    setPendingAdvance(false);
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("transition");
    }
  }, [pendingAdvance, isQuestionsLoaded, currentQuestion, questions.length]);

  return (
    <div className="min-h-screen bg-quiz-background">
      <header className="border-b bg-quiz-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <picture>
              <source
                type="image/avif"
                srcSet="/imgs/ThinkAndTalk-64.avif 1x, /imgs/ThinkAndTalk-128.avif 2x"
              />
              <source
                type="image/webp"
                srcSet="/imgs/ThinkAndTalk-64.webp 1x, /imgs/ThinkAndTalk-128.webp 2x"
              />
              <img
                src="/imgs/ThinkAndTalk.png"
                alt="ThinkAndTalk"
                className="h-8 w-auto"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </picture>
            {(step === "questions" && currentQuestion > 0) || step === "age_highlight" || step === "mid_message" ? (
              <button
                type="button"
                onClick={step === "age_highlight" || step === "mid_message" ? () => setStep("questions") : handleBackQuestion}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-quiz-border/60 text-quiz-muted hover:text-quiz-foreground hover:border-quiz-purple/40 transition-colors"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-4">
            {(step === "questions" || step === "age_highlight" || step === "mid_message" || step === "processing") && (
              <div className="hidden md:block w-[240px]">
                <div className="h-1.5 bg-quiz-border/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-quiz-blue to-quiz-purple transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <LanguageSelector />
          </div>
        </div>
      </header>

      {step === "questions" && (
        <div key={`question-${currentQuestion}`}>
          <QuizQuestion
            question={questions[currentQuestion]}
            currentIndex={currentQuestion}
            totalQuestions={questions.length}
            onAnswer={handleAnswer}
            selectedAnswer={answers[questions[currentQuestion].key as keyof QuizAnswers]}
            slideDirection={slideDirection}
          />
        </div>
      )}

      {step === "age_highlight" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizAgeHighlight
            ageRange={answers.age_range}
            mainGoal={answers.main_goal}
            currentIndex={currentQuestion}
            totalQuestions={questions.length}
            onContinue={handleAgeHighlightContinue}
          />
        </Suspense>
      )}

      {step === "mid_message" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizMidMessage
            currentIndex={currentQuestion}
            totalQuestions={questions.length}
            onContinue={handleMidMessageContinue}
          />
        </Suspense>
      )}

      {step === "processing" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizProcessing
            currentIndex={currentQuestion}
            totalQuestions={questions.length}
            answers={answers}
            onComplete={handleProcessingComplete}
          />
        </Suspense>
      )}
      
      {step === "transition" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizTransition onComplete={handleTransitionComplete} />
        </Suspense>
      )}
      
      {step === "coupon" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizCoupon onReveal={handleCouponRevealed} />
        </Suspense>
      )}
      
      {step === "email" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizEmailCapture onSubmit={handleEmailSubmit} />
        </Suspense>
      )}
      
      {step === "results" && (
        <Suspense fallback={<div className="min-h-screen" />}>
          <QuizResults 
            answers={answers} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default Quiz;
