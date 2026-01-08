import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Play, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { SortableTableHead, SortDirection } from "@/components/SortableTableHead";

const LANGUAGE_OPTIONS = [
  { value: "pt-BR", label: "Portugues (BR)" },
  { value: "en-US", label: "Ingles (US)" },
  { value: "en-GB", label: "Ingles (UK)" },
  { value: "es-ES", label: "Espanhol (ES)" },
  { value: "fr-FR", label: "Frances (FR)" },
  { value: "de-DE", label: "Alemao (DE)" },
  { value: "it-IT", label: "Italiano (IT)" },
];

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
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [contentLanguage, setContentLanguage] = useState("pt-BR");
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({
    key: "term",
    direction: "asc",
  });

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

  function handleSort(key: string) {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  const sortedTerms = useMemo(() => {
    if (!sort.direction) return terms;

    return [...terms].sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";

      if (sort.key === "term") {
        aVal = a.term.toLowerCase();
        bVal = b.term.toLowerCase();
      } else if (sort.key === "status") {
        aVal = a.lastQuery?.status || "pending";
        bVal = b.lastQuery?.status || "pending";
      } else if (sort.key === "queried_at") {
        aVal = a.lastQuery?.queried_at ? new Date(a.lastQuery.queried_at).getTime() : 0;
        bVal = b.lastQuery?.queried_at ? new Date(b.lastQuery.queried_at).getTime() : 0;
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [terms, sort]);

  function toggleTermSelection(termId: string) {
    setSelectedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(termId)) {
        next.delete(termId);
      } else {
        next.add(termId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedTerms.size === terms.length) {
      setSelectedTerms(new Set());
    } else {
      setSelectedTerms(new Set(terms.map((t) => t.id)));
    }
  }

  async function handleExecuteQueries() {
    const termsToQuery = terms.filter((t) => selectedTerms.has(t.id));

    if (termsToQuery.length === 0) {
      toast({
        title: "Atenção",
        description: "Selecione pelo menos um termo para consultar.",
        variant: "destructive",
      });
      return;
    }

    setIsExecuting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const term of termsToQuery) {
        try {
          const { data, error } = await supabase.functions.invoke("google-alerts-query", {
            body: { termId: term.id, term: term.term, language: contentLanguage },
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

      setSelectedTerms(new Set());
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
            <div className="flex items-center gap-3">
              <Select value={contentLanguage} onValueChange={setContentLanguage}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Idioma do conteudo" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleExecuteQueries} disabled={isExecuting || isLoading || selectedTerms.size === 0}>
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Consultar selecionados ({selectedTerms.size})
              </Button>
            </div>
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
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedTerms.size === terms.length && terms.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <SortableTableHead
                    sortKey="term"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Termo
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="status"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Status
                  </SortableTableHead>
                  <SortableTableHead
                    sortKey="queried_at"
                    currentSort={sort}
                    onSort={handleSort}
                  >
                    Última consulta
                  </SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTerms.map((term) => (
                  <TableRow key={term.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedTerms.has(term.id)}
                        onCheckedChange={() => toggleTermSelection(term.id)}
                      />
                    </TableCell>
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
