import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

type TermWithStatus = {
  id: string;
  term: string;
  lastQuery?: {
    status: string;
    queried_at: string;
  };
};

export default function GoogleAlerts() {
  const { toast } = useToast();
  const [terms, setTerms] = useState<TermWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    loadTermsWithStatus();
  }, []);

  async function loadTermsWithStatus() {
    setIsLoading(true);
    try {
      const { data: termsData, error: termsError } = await supabase
        .from("search_terms")
        .select("id, term")
        .order("created_at", { ascending: true });

      if (termsError) throw termsError;

      // Get latest query result for each term
      const termsWithStatus: TermWithStatus[] = [];

      for (const term of termsData || []) {
        const { data: queryData } = await supabase
          .from("alert_query_results")
          .select("status, queried_at")
          .eq("term_id", term.id)
          .order("queried_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        termsWithStatus.push({
          id: term.id,
          term: term.term,
          lastQuery: queryData || undefined,
        });
      }

      setTerms(termsWithStatus);
    } catch (error) {
      console.error("Error loading terms:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os termos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleExecuteQueries() {
    if (terms.length === 0) {
      toast({
        title: "Atenção",
        description: "Nenhum termo cadastrado. Adicione termos primeiro.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const term of terms) {
        try {
          const { data, error } = await supabase.functions.invoke("google-alerts-query", {
            body: { termId: term.id, term: term.term },
          });

          if (error) throw error;

          if (data?.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Error querying term ${term.term}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "Consultas finalizadas",
        description: `${successCount} sucesso(s), ${errorCount} erro(s)`,
      });

      await loadTermsWithStatus();
    } catch (error) {
      console.error("Error executing queries:", error);
      toast({
        title: "Erro",
        description: "Erro ao executar consultas.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }

  function getStatusBadge(status?: string) {
    if (!status) {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
    if (status === "success") {
      return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Sucesso</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">Passo 2</span> — Consultas Google Alerts
              </CardTitle>
              <CardDescription>
                Execute as consultas no Google Alerts para cada termo cadastrado.
              </CardDescription>
            </div>
            <Button onClick={handleExecuteQueries} disabled={isExecuting || isLoading}>
              {isExecuting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Executar consultas no Google Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : terms.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum termo cadastrado. Adicione termos na página anterior.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Termo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última consulta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell className="font-mono">{term.term}</TableCell>
                    <TableCell>{getStatusBadge(term.lastQuery?.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {term.lastQuery?.queried_at
                        ? format(new Date(term.lastQuery.queried_at), "dd/MM/yyyy HH:mm")
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
