import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import QuizWelcome from "@/components/quiz/QuizWelcome";
import QuizQuestion from "@/components/quiz/QuizQuestion";
import QuizTransition from "@/components/quiz/QuizTransition";
import QuizCoupon from "@/components/quiz/QuizCoupon";
import QuizEmailCapture from "@/components/quiz/QuizEmailCapture";
import QuizResults from "@/components/quiz/QuizResults";
import { QUIZ_QUESTIONS } from "@/components/quiz/quizData";

export type QuizStep = 
  | "welcome" 
  | "questions" 
  | "transition" 
  | "coupon" 
  | "email" 
  | "results";

export interface QuizAnswers {
  age_range?: string;
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

const Quiz = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<QuizStep>("welcome");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [email, setEmail] = useState("");
  const [quizId, setQuizId] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");

  // Create quiz response on start
  const handleStart = async () => {
    const { data, error } = await supabase
      .from("quiz_responses")
      .insert({})
      .select("id")
      .single();

    if (data) {
      setQuizId(data.id);
    }
    setStep("questions");
  };

  // Save answer and advance
  const handleAnswer = async (questionKey: string, value: string | string[]) => {
    const newAnswers = { ...answers, [questionKey]: value };
    setAnswers(newAnswers);

    // Save to database
    if (quizId) {
      await supabase
        .from("quiz_responses")
        .update({ [questionKey]: value })
        .eq("id", quizId);
    }

    // Auto-advance with animation
    setSlideDirection("left");
    
    setTimeout(() => {
      if (currentQuestion < QUIZ_QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setStep("transition");
      }
    }, 300);
  };

  const handleTransitionComplete = () => {
    setStep("coupon");
  };

  const handleCouponRevealed = async () => {
    if (quizId) {
      await supabase
        .from("quiz_responses")
        .update({ coupon_revealed: true })
        .eq("id", quizId);
    }
    setStep("email");
  };

  const handleEmailSubmit = async (submittedEmail: string) => {
    setEmail(submittedEmail);
    if (quizId) {
      await supabase
        .from("quiz_responses")
        .update({ 
          email: submittedEmail,
          completed_at: new Date().toISOString()
        })
        .eq("id", quizId);
    }
    setStep("results");
  };

  const handleActivatePlan = () => {
    // Navigate to premium page or auth
    navigate("/premium");
  };

  return (
    <div className="min-h-screen bg-quiz-background">
      {step === "welcome" && (
        <QuizWelcome onStart={handleStart} />
      )}
      
      {step === "questions" && (
        <QuizQuestion
          question={QUIZ_QUESTIONS[currentQuestion]}
          currentIndex={currentQuestion}
          totalQuestions={QUIZ_QUESTIONS.length}
          onAnswer={handleAnswer}
          selectedAnswer={answers[QUIZ_QUESTIONS[currentQuestion].key as keyof QuizAnswers]}
          slideDirection={slideDirection}
        />
      )}
      
      {step === "transition" && (
        <QuizTransition onComplete={handleTransitionComplete} />
      )}
      
      {step === "coupon" && (
        <QuizCoupon onReveal={handleCouponRevealed} />
      )}
      
      {step === "email" && (
        <QuizEmailCapture onSubmit={handleEmailSubmit} />
      )}
      
      {step === "results" && (
        <QuizResults 
          answers={answers} 
          onActivate={handleActivatePlan}
        />
      )}
    </div>
  );
};

export default Quiz;