import { useState, useEffect, Suspense, lazy, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ArrowLeft, Baby, GraduationCap, Briefcase, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { QuizQuestionData } from "@/components/quiz/quizTypes";

const CHECKOUT_URL = "https://lastlink.com/p/C7229FE68/checkout-payment/";

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

interface AnswerTimestamp {
  questionKey: string;
  answeredAt: string;
  selectedValue: string | string[];
  [key: string]: string | string[]; // Index signature for Json compatibility
}

// Get São Paulo timezone timestamp (UTC-3)
const getSaoPauloTimestamp = () => {
  return new Date().toLocaleString('sv-SE', { 
    timeZone: 'America/Sao_Paulo',
    hour12: false 
  }).replace(' ', 'T') + '-03:00';
};

const Quiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<QuizStep>("questions");
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  
  // Session tracking state
  const answerTimestampsRef = useRef<AnswerTimestamp[]>([]);
  const sessionStartedRef = useRef<string | null>(null);

  // Get device info for tracking
  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      referrer: document.referrer || null,
    };
  };

  // Track answer timestamp
  const trackAnswerTimestamp = (questionKey: string, selectedValue: string | string[]) => {
    const timestamp: AnswerTimestamp = {
      questionKey: questionKey,
      answeredAt: getSaoPauloTimestamp(),
      selectedValue: selectedValue,
    };
    answerTimestampsRef.current = [...answerTimestampsRef.current, timestamp];
    return answerTimestampsRef.current;
  };

  // Create quiz response and session on start
  const handleStart = async () => {
    const newQuizId = crypto.randomUUID();
    const newSessionId = crypto.randomUUID();
    const startTime = getSaoPauloTimestamp();
    const deviceInfo = getDeviceInfo();
    sessionStartedRef.current = startTime;
    
    // Create quiz response first
    const { error: quizError } = await supabase
      .from("quiz_responses")
      .insert({ 
        id: newQuizId,
        session_started_at: startTime,
        device_info: deviceInfo,
        answer_timestamps: [],
      });

    if (quizError) {
      console.error("Failed to create quiz response:", quizError);
      toast({
        title: "Erro ao iniciar o quiz",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
      setQuizId(null);
      setSessionId(null);
    } else {
      setQuizId(newQuizId);
      
      // Create separate tracking session
      const { error: sessionError } = await supabase
        .from("quiz_sessions")
        .insert({
          id: newSessionId,
          quiz_response_id: newQuizId,
          session_started_at: startTime,
          device_info: deviceInfo,
          answer_timestamps: [],
        });
      
      if (sessionError) {
        console.error("Failed to create tracking session:", sessionError);
      } else {
        setSessionId(newSessionId);
      }
    }
    setStep("questions");
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
    
    // Track timestamp for this answer
    const updatedTimestamps = trackAnswerTimestamp(questionKey, value);

    // Save to database with timestamp (both tables in parallel)
    if (quizId && questionKey !== "gender") {
      // Update quiz responses
      const quizUpdate = supabase
        .from("quiz_responses")
        .update({ 
          [questionKey]: value,
          answer_timestamps: updatedTimestamps,
        })
        .eq("id", quizId);
      
      // Update tracking session separately
      const sessionUpdate = sessionId 
        ? supabase
            .from("quiz_sessions")
            .update({ answer_timestamps: updatedTimestamps })
            .eq("id", sessionId)
        : null;
      
      const [quizResult, sessionResult] = await Promise.all([
        quizUpdate,
        sessionUpdate,
      ]);
      
      if (quizResult.error) {
        console.error("Failed to update quiz response:", quizResult.error);
      }
      if (sessionResult?.error) {
        console.error("Failed to update session:", sessionResult.error);
      }
    }

    // Auto-advance with animation
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

  const handleTransitionComplete = () => {
    // Track transition complete
    trackAnswerTimestamp("transition_complete", "completed");
    setStep("coupon");
  };

  const handleCouponRevealed = async () => {
    // Track coupon reveal
    const updatedTimestamps = trackAnswerTimestamp("coupon_revealed", "revealed");
    
    const quizUpdate = quizId
      ? supabase
          .from("quiz_responses")
          .update({ 
            coupon_revealed: true,
            answer_timestamps: updatedTimestamps,
          })
          .eq("id", quizId)
      : null;
    
    const sessionUpdate = sessionId
      ? supabase
          .from("quiz_sessions")
          .update({ answer_timestamps: updatedTimestamps })
          .eq("id", sessionId)
      : null;
    
    await Promise.all([quizUpdate, sessionUpdate]);
    setStep("email");
  };

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    
    // Track email submission
    const updatedTimestamps = trackAnswerTimestamp("email_submitted", submittedEmail);
    const completedAt = getSaoPauloTimestamp();
    
    const quizUpdate = quizId
      ? supabase
          .from("quiz_responses")
          .update({ 
            email: submittedEmail,
            completed_at: completedAt,
            reached_results: true,
            answer_timestamps: updatedTimestamps,
          })
          .eq("id", quizId)
      : null;
    
    const sessionUpdate = sessionId
      ? supabase
          .from("quiz_sessions")
          .update({ 
            reached_results: true,
            completed_at: completedAt,
            answer_timestamps: updatedTimestamps,
          })
          .eq("id", sessionId)
      : null;
    
    await Promise.all([quizUpdate, sessionUpdate]);
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
        window.location.href = CHECKOUT_URL;
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
