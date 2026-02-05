import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QUIZ_QUESTIONS } from "@/components/quiz/quizData";

interface SessionDisplay {
  id: string;
  session_started_at: string | null;
  reached_results: boolean | null;
  email: string | null;
  completed_at: string | null;
  answered_count: number;
  last_answer_at: string | null;
}

interface RecentSessionsProps {
  sessions: SessionDisplay[];
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  const totalQuestions = QUIZ_QUESTIONS.length;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd/MM/yy HH:mm", { locale: ptBR });
    } catch {
      return "-";
    }
  };

  const calculateDuration = (session: SessionDisplay): string => {
    if (!session.session_started_at || !session.last_answer_at) return "-";
    
    const start = new Date(session.session_started_at).getTime();
    const lastAnswer = new Date(session.last_answer_at).getTime();
    const durationMs = lastAnswer - start;
    
    if (durationMs < 0) return "-";
    
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Início</TableHead>
              <TableHead>Questões</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="font-mono text-xs">
                  {formatDate(session.session_started_at)}
                </TableCell>
                <TableCell>
                  {session.answered_count} / {totalQuestions}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {calculateDuration(session)}
                </TableCell>
                <TableCell>
                  {session.reached_results ? (
                    <Badge variant="default">
                      Concluído
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Abandonou</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs max-w-[150px] truncate">
                  {session.email || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {sessions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma sessão registrada ainda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
