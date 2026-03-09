import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, MessageSquare, FileText, Play, Eye, ShoppingCart, RotateCcw } from "lucide-react";
import { DateFilter } from "@/components/DateFilter";
import { format } from "date-fns";

interface DemoSession {
  id: string;
  session_started_at: string;
  user_name: string | null;
  name_captured_at: string | null;
  topic: string | null;
  topic_captured_at: string | null;
  tone: string | null;
  tone_selected_at: string | null;
  news_selected_at: string | null;
  news_count: number | null;
  script_generated_at: string | null;
  teleprompter_started_at: string | null;
  teleprompter_completed_at: string | null;
  sales_page_viewed_at: string | null;
  checkout_button_1_at: string | null;
  checkout_button_2_at: string | null;
  restart_at: string | null;
  created_at: string;
}

function toSaoPaulo(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function toDateOnly(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function parseDate(dd_mm_yyyy: string): string | null {
  if (dd_mm_yyyy.length !== 10) return null;
  const [d, m, y] = dd_mm_yyyy.split("/");
  return `${y}-${m}-${d}`;
}

export default function DemoAnalytics() {
  const [sessions, setSessions] = useState<DemoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("demo_sessions")
        .select("*")
        .order("session_started_at", { ascending: false })
        .limit(500);

      const isoStart = parseDate(startDate);
      const isoEnd = parseDate(endDate);
      if (isoStart) query = query.gte("session_started_at", isoStart);
      if (isoEnd) query = query.lte("session_started_at", isoEnd + "T23:59:59");

      const { data, error } = await query;
      if (error) {
        console.error("Failed to fetch demo sessions:", error);
      }
      setSessions((data as DemoSession[]) || []);
      setLoading(false);
    };

    // Only refetch when both dates are filled or both empty
    const startReady = startDate.length === 10 || startDate.length === 0;
    const endReady = endDate.length === 10 || endDate.length === 0;
    if (startReady && endReady) {
      void fetch();
    }
  }, [startDate, endDate]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const names = sessions.filter((s) => s.name_captured_at).length;
    const topics = sessions.filter((s) => s.topic_captured_at).length;
    const scripts = sessions.filter((s) => s.script_generated_at).length;
    const teleprompterStarted = sessions.filter((s) => s.teleprompter_started_at).length;
    const teleprompterCompleted = sessions.filter((s) => s.teleprompter_completed_at).length;
    const salesViews = sessions.filter((s) => s.sales_page_viewed_at).length;
    const checkout1 = sessions.filter((s) => s.checkout_button_1_at).length;
    const checkout2 = sessions.filter((s) => s.checkout_button_2_at).length;
    const restarts = sessions.filter((s) => s.restart_at).length;
    return { total, names, topics, scripts, teleprompterStarted, teleprompterCompleted, salesViews, checkout1, checkout2, restarts };
  }, [sessions]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Demo Analytics</h1>
          <div className="flex items-center gap-2">
            <DateFilter value={startDate} onChange={setStartDate} placeholder="De dd/mm/aaaa" />
            <DateFilter value={endDate} onChange={setEndDate} placeholder="Até dd/mm/aaaa" />
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          <SummaryCard icon={<User className="h-5 w-5" />} label="Sessões" value={stats.total} />
          <SummaryCard icon={<User className="h-5 w-5" />} label="Nomes" value={stats.names} />
          <SummaryCard icon={<MessageSquare className="h-5 w-5" />} label="Temas" value={stats.topics} />
          <SummaryCard icon={<FileText className="h-5 w-5" />} label="Roteiros" value={stats.scripts} />
          <SummaryCard icon={<Play className="h-5 w-5" />} label="Teleprompter" value={stats.teleprompterStarted} detail={`Concluídos: ${stats.teleprompterCompleted}`} />
          <SummaryCard icon={<Eye className="h-5 w-5" />} label="Pág. Vendas" value={stats.salesViews} />
          <SummaryCard icon={<ShoppingCart className="h-5 w-5" />} label="Checkout" value={stats.checkout1 + stats.checkout2} detail={`Botão 1: ${stats.checkout1} | Botão 2: ${stats.checkout2}`} />
          <SummaryCard icon={<RotateCcw className="h-5 w-5" />} label="Reinícios" value={stats.restarts} />
        </div>

        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Funil de conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelBar steps={[
              { label: "Sessões", value: stats.total },
              { label: "Nomes", value: stats.names },
              { label: "Temas", value: stats.topics },
              { label: "Roteiros", value: stats.scripts },
              { label: "Teleprompter", value: stats.teleprompterStarted },
              { label: "Pág. Vendas", value: stats.salesViews },
              { label: "Checkout", value: stats.checkout1 + stats.checkout2 },
            ]} />
          </CardContent>
        </Card>

        {/* Recent Sessions Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Sessões recentes ({sessions.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Tom</TableHead>
                  <TableHead>Notícias</TableHead>
                  <TableHead>Roteiro</TableHead>
                  <TableHead>Teleprompter</TableHead>
                  <TableHead>Vendas</TableHead>
                  <TableHead>Checkout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-xs">{toSaoPaulo(s.session_started_at)}</TableCell>
                    <TableCell className="text-sm">{s.user_name || "—"}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{s.topic || "—"}</TableCell>
                    <TableCell className="text-sm">{s.tone || "—"}</TableCell>
                    <TableCell className="text-sm text-center">{s.news_count ?? "—"}</TableCell>
                    <TableCell className="text-sm">{s.script_generated_at ? "✅" : "—"}</TableCell>
                    <TableCell className="text-sm">
                      {s.teleprompter_completed_at ? "✅" : s.teleprompter_started_at ? "▶️" : "—"}
                    </TableCell>
                    <TableCell className="text-sm">{s.sales_page_viewed_at ? "✅" : "—"}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {s.checkout_button_1_at && "B1 "}
                      {s.checkout_button_2_at && "B2"}
                      {!s.checkout_button_1_at && !s.checkout_button_2_at && "—"}
                    </TableCell>
                  </TableRow>
                ))}
                {sessions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      Nenhuma sessão encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail?: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs sm:text-sm font-medium">{label}</span>
        </div>
        <span className="text-2xl sm:text-3xl font-bold text-foreground">{value}</span>
        {detail && <span className="text-xs text-muted-foreground">{detail}</span>}
      </CardContent>
    </Card>
  );
}

function FunnelBar({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {steps.map((step) => (
        <div key={step.label} className="flex items-center gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground w-24 sm:w-28 text-right shrink-0">{step.label}</span>
          <div className="flex-1 bg-muted rounded-full h-6 sm:h-7 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
              style={{ width: `${Math.max((step.value / max) * 100, 2)}%` }}
            >
              <span className="text-xs font-semibold text-primary-foreground">{step.value}</span>
            </div>
          </div>
          {max > 0 && (
            <span className="text-xs text-muted-foreground w-12 text-right">
              {((step.value / steps[0].value) * 100).toFixed(0)}%
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
