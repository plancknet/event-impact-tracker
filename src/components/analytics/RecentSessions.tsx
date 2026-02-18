import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { QUIZ_QUESTIONS } from "@/components/quiz/quizData";
import { SortableTableHead, type SortDirection } from "@/components/SortableTableHead";

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
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({ key: "", direction: null });

  const handleSort = (key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: null };
    });
  };

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
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${seconds}s`;
  };

  const getDurationMs = (session: SessionDisplay): number => {
    if (!session.session_started_at || !session.last_answer_at) return -1;
    return new Date(session.last_answer_at).getTime() - new Date(session.session_started_at).getTime();
  };

  const sortedSessions = useMemo(() => {
    if (!sort.key || !sort.direction) return sessions;
    const mult = sort.direction === "asc" ? 1 : -1;
    return [...sessions].sort((a, b) => {
      switch (sort.key) {
        case "start":
          return mult * ((a.session_started_at || "").localeCompare(b.session_started_at || ""));
        case "questions":
          return mult * (a.answered_count - b.answered_count);
        case "duration":
          return mult * (getDurationMs(a) - getDurationMs(b));
        case "status":
          return mult * (Number(a.reached_results) - Number(b.reached_results));
        case "email":
          return mult * ((a.email || "").localeCompare(b.email || ""));
        default:
          return 0;
      }
    });
  }, [sessions, sort]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead sortKey="start" currentSort={sort} onSort={handleSort}>Início</SortableTableHead>
              <SortableTableHead sortKey="questions" currentSort={sort} onSort={handleSort}>Questões</SortableTableHead>
              <SortableTableHead sortKey="duration" currentSort={sort} onSort={handleSort}>Duração</SortableTableHead>
              <SortableTableHead sortKey="status" currentSort={sort} onSort={handleSort}>Status</SortableTableHead>
              <SortableTableHead sortKey="email" currentSort={sort} onSort={handleSort}>Email</SortableTableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSessions.map((session) => (
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
                    <Badge variant="default">Concluído</Badge>
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
