import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QUIZ_QUESTIONS } from "@/components/quiz/quizData";
import { CompletionRateCard } from "@/components/analytics/CompletionRateCard";
import { AbandonmentFunnel } from "@/components/analytics/AbandonmentFunnel";
import { TimePerQuestion } from "@/components/analytics/TimePerQuestion";
import { RecentSessions } from "@/components/analytics/RecentSessions";
import { Loader2, BarChart3, Clock, Users, TrendingDown } from "lucide-react";

interface QuizSession {
  id: string;
  session_started_at: string | null;
  answer_timestamps: AnswerTimestamp[] | null;
  reached_results: boolean | null;
  email: string | null;
  completed_at: string | null;
  device_info: DeviceInfo | null;
}

interface AnswerTimestamp {
  questionKey: string;
  answeredAt: string;
  selectedValue: string | string[];
}

interface DeviceInfo {
  userAgent?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  platform?: string;
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

export default function QuizAnalytics() {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("quiz_responses")
        .select("id, session_started_at, answer_timestamps, reached_results, email, completed_at, device_info")
        .not("session_started_at", "is", null)
        .order("session_started_at", { ascending: false })
        .limit(500);

      if (error) throw error;

      const typedData = (data || []).map((item) => ({
        ...item,
        answer_timestamps: item.answer_timestamps as unknown as AnswerTimestamp[] | null,
        device_info: item.device_info as unknown as DeviceInfo | null,
      }));

      setSessions(typedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionRate = (): { completed: number; total: number; rate: number } => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.reached_results).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, rate };
  };

  const calculateFunnelSteps = (): FunnelStep[] => {
    const total = sessions.length;
    if (total === 0) return [];

    const steps: FunnelStep[] = [
      { step: "start", label: "Início do Quiz", count: total, percentage: 100 },
    ];

    QUIZ_QUESTIONS.forEach((q, index) => {
      const answeredCount = sessions.filter((s) => {
        const timestamps = s.answer_timestamps || [];
        return timestamps.some((t) => t.questionKey === q.key);
      }).length;

      steps.push({
        step: q.key,
        label: `Q${index + 1}: ${q.question.substring(0, 30)}...`,
        count: answeredCount,
        percentage: (answeredCount / total) * 100,
      });
    });

    const reachedResults = sessions.filter((s) => s.reached_results).length;
    steps.push({
      step: "results",
      label: "Página de Resultados",
      count: reachedResults,
      percentage: (reachedResults / total) * 100,
    });

    const withEmail = sessions.filter((s) => s.email).length;
    steps.push({
      step: "email",
      label: "Email Capturado",
      count: withEmail,
      percentage: (withEmail / total) * 100,
    });

    return steps;
  };

  const calculateTimePerQuestion = (): QuestionTime[] => {
    const questionTimes: Record<string, { totalMs: number; count: number }> = {};

    sessions.forEach((session) => {
      const timestamps = session.answer_timestamps || [];
      const startTime = session.session_started_at
        ? new Date(session.session_started_at).getTime()
        : null;

      timestamps.forEach((t, index) => {
        const currentTime = new Date(t.answeredAt).getTime();
        let prevTime: number;

        if (index === 0 && startTime) {
          prevTime = startTime;
        } else if (index > 0) {
          prevTime = new Date(timestamps[index - 1].answeredAt).getTime();
        } else {
          return;
        }

        const timeSpent = currentTime - prevTime;
        if (timeSpent > 0 && timeSpent < 300000) {
          // Ignora tempos > 5min (provavelmente abandono)
          if (!questionTimes[t.questionKey]) {
            questionTimes[t.questionKey] = { totalMs: 0, count: 0 };
          }
          questionTimes[t.questionKey].totalMs += timeSpent;
          questionTimes[t.questionKey].count += 1;
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
                {sessions.filter((s) => s.email).length}
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
            <RecentSessions sessions={sessions.slice(0, 50)} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
