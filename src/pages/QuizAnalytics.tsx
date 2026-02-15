import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QUIZ_QUESTIONS } from "@/components/quiz/quizData";
import { AbandonmentFunnel } from "@/components/analytics/AbandonmentFunnel";
import { TimePerQuestion } from "@/components/analytics/TimePerQuestion";
import { RecentSessions } from "@/components/analytics/RecentSessions";
import { Loader2, BarChart3, Clock, Users, TrendingDown } from "lucide-react";

interface QuizResponse {
  id: string;
  session_started_at: string | null;
  reached_results: boolean | null;
  email: string | null;
  completed_at: string | null;
  // Question answers
  age_range: string | null;
  gender: string | null;
  main_goal: string | null;
  comfort_recording: string | null;
  biggest_challenge: string | null;
  planning_style: string | null;
  editing_time: string | null;
  niche: string | null;
  creator_level: string | null;
  audience_type: string | null;
  audience_age: string | null;
  audience_gender: string | null;
  video_format: string | null;
  video_duration: string | null;
  platforms: string[] | null;
  speaking_tone: string | null;
  energy_level: string | null;
  content_goal: string | null;
  sales_page_at: string | null;
  checkout_button_1_at: string | null;
  checkout_button_2_at: string | null;
  // Timestamps for each question
  age_range_at: string | null;
  gender_at: string | null;
  main_goal_at: string | null;
  comfort_recording_at: string | null;
  biggest_challenge_at: string | null;
  planning_style_at: string | null;
  editing_time_at: string | null;
  niche_at: string | null;
  creator_level_at: string | null;
  audience_type_at: string | null;
  audience_age_at: string | null;
  audience_gender_at: string | null;
  video_format_at: string | null;
  video_duration_at: string | null;
  platforms_at: string | null;
  speaking_tone_at: string | null;
  energy_level_at: string | null;
  content_goal_at: string | null;
}

interface FunnelStep {
  step: string;
  label: string;
  count: number;
  percentage: number;
}

interface QuestionTime {
  questionKey: string;
  questionLabel: string;
  avgTimeSeconds: number;
  totalResponses: number;
}

// Map question keys to their timestamp column names
const QUESTION_TIMESTAMP_MAP: Record<string, string> = {
  age_range: "age_range_at",
  gender: "gender_at",
  main_goal: "main_goal_at",
  comfort_recording: "comfort_recording_at",
  biggest_challenge: "biggest_challenge_at",
  planning_style: "planning_style_at",
  editing_time: "editing_time_at",
  niche: "niche_at",
  creator_level: "creator_level_at",
  audience_type: "audience_type_at",
  audience_age: "audience_age_at",
  audience_gender: "audience_gender_at",
  video_format: "video_format_at",
  video_duration: "video_duration_at",
  platforms: "platforms_at",
  speaking_tone: "speaking_tone_at",
  energy_level: "energy_level_at",
  content_goal: "content_goal_at",
};

export default function QuizAnalytics() {
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResponses();
  }, []);

  const fetchResponses = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("*")
        .not("session_started_at", "is", null)
        .order("session_started_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      setResponses((data || []) as QuizResponse[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (): { completed: number; total: number; rate: number } => {
    const total = responses.length;
    const completed = responses.filter((r) => r.reached_results).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, rate };
  };

  const calculateFunnelSteps = (): FunnelStep[] => {
    const total = responses.length;
    if (total === 0) return [];

    const steps: FunnelStep[] = [
      { step: "start", label: "Início do Quiz", count: total, percentage: 100 },
    ];

    QUIZ_QUESTIONS.forEach((q, index) => {
      const timestampKey = QUESTION_TIMESTAMP_MAP[q.key];
      const answeredCount = responses.filter((r) => {
        const timestamp = r[timestampKey as keyof QuizResponse];
        return timestamp !== null;
      }).length;

      steps.push({
        step: q.key,
        label: `Q${index + 1}: ${q.question.substring(0, 30)}...`,
        count: answeredCount,
        percentage: (answeredCount / total) * 100,
      });
    });

    const reachedResults = responses.filter((r) => r.reached_results).length;
    steps.push({
      step: "results",
      label: "Página de Resultados",
      count: reachedResults,
      percentage: (reachedResults / total) * 100,
    });

    const withEmail = responses.filter((r) => r.email).length;
    steps.push({
      step: "email",
      label: "Email Capturado",
      count: withEmail,
      percentage: (withEmail / total) * 100,
    });

    const salesPage = responses.filter((r) => r.sales_page_at).length;
    steps.push({
      step: "sales_page",
      label: "Página de Vendas",
      count: salesPage,
      percentage: (salesPage / total) * 100,
    });

    const checkoutButtons = [
      { key: "checkout_button_1_at", label: "Clique Checkout (Botão 1)" },
      { key: "checkout_button_2_at", label: "Clique Checkout (Botão 2)" },
    ];

    checkoutButtons.forEach((button) => {
      const clickedCount = responses.filter((r) => r[button.key as keyof QuizResponse]).length;
      steps.push({
        step: button.key,
        label: button.label,
        count: clickedCount,
        percentage: (clickedCount / total) * 100,
      });
    });

    return steps;
  };

  const calculateTimePerQuestion = (): QuestionTime[] => {
    const questionTimes: Record<string, { totalMs: number; count: number }> = {};

    responses.forEach((response) => {
      const startTime = response.session_started_at
        ? new Date(response.session_started_at).getTime()
        : null;

      if (!startTime) return;

      // Build ordered list of answered questions with timestamps
      const answeredQuestions: { key: string; timestamp: number }[] = [];
      
      QUIZ_QUESTIONS.forEach((q) => {
        const timestampKey = QUESTION_TIMESTAMP_MAP[q.key];
        const timestamp = response[timestampKey as keyof QuizResponse] as string | null;
        if (timestamp) {
          answeredQuestions.push({
            key: q.key,
            timestamp: new Date(timestamp).getTime(),
          });
        }
      });

      // Sort by timestamp
      answeredQuestions.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate time spent on each question
      answeredQuestions.forEach((q, index) => {
        let prevTime: number;
        if (index === 0) {
          prevTime = startTime;
        } else {
          prevTime = answeredQuestions[index - 1].timestamp;
        }

        const timeSpent = q.timestamp - prevTime;
        
        // Ignore times > 5min (likely abandonment) or negative times
        if (timeSpent > 0 && timeSpent < 300000) {
          if (!questionTimes[q.key]) {
            questionTimes[q.key] = { totalMs: 0, count: 0 };
          }
          questionTimes[q.key].totalMs += timeSpent;
          questionTimes[q.key].count += 1;
        }
      });
    });

    return QUIZ_QUESTIONS.map((q) => {
      const data = questionTimes[q.key];
      return {
        questionKey: q.key,
        questionLabel: q.question.substring(0, 40) + (q.question.length > 40 ? "..." : ""),
        avgTimeSeconds: data ? data.totalMs / data.count / 1000 : 0,
        totalResponses: data?.count || 0,
      };
    }).filter((q) => q.totalResponses > 0);
  };

  // Convert responses to session format for RecentSessions component
  const getSessionsForDisplay = () => {
    return responses.slice(0, 50).map((r) => {
      // Count answered questions
      const answeredCount = QUIZ_QUESTIONS.filter((q) => {
        const timestampKey = QUESTION_TIMESTAMP_MAP[q.key];
        return r[timestampKey as keyof QuizResponse] !== null;
      }).length;

      // Find last answered timestamp for duration calculation
      let lastAnswerTime: string | null = null;
      QUIZ_QUESTIONS.forEach((q) => {
        const timestampKey = QUESTION_TIMESTAMP_MAP[q.key];
        const ts = r[timestampKey as keyof QuizResponse] as string | null;
        if (ts && (!lastAnswerTime || ts > lastAnswerTime)) {
          lastAnswerTime = ts;
        }
      });

      return {
        id: r.id,
        session_started_at: r.session_started_at,
        answer_timestamps: null, // Not used anymore
        reached_results: r.reached_results,
        email: r.email,
        completed_at: r.completed_at,
        answered_count: answeredCount,
        last_answer_at: lastAnswerTime,
      };
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-6">
          <p className="text-destructive">{error}</p>
        </Card>
      </div>
    );
  }

  const completionData = calculateCompletionRate();
  const funnelSteps = calculateFunnelSteps();
  const questionTimes = calculateTimePerQuestion();
  const sessionsForDisplay = getSessionsForDisplay();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Analytics do Quiz</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Sessões
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionData.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Conclusão
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completionData.rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {completionData.completed} de {completionData.total}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Emails Capturados
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {responses.filter((r) => r.email).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo Médio Total
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {questionTimes.length > 0
                  ? (
                      questionTimes.reduce((sum, q) => sum + q.avgTimeSeconds, 0)
                    ).toFixed(0)
                  : 0}
                s
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="funnel" className="space-y-4">
          <TabsList>
            <TabsTrigger value="funnel">Funil de Abandono</TabsTrigger>
            <TabsTrigger value="time">Tempo por Questão</TabsTrigger>
            <TabsTrigger value="sessions">Sessões Recentes</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel">
            <AbandonmentFunnel steps={funnelSteps} />
          </TabsContent>

          <TabsContent value="time">
            <TimePerQuestion data={questionTimes} />
          </TabsContent>

          <TabsContent value="sessions">
            <RecentSessions sessions={sessionsForDisplay} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
