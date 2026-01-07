import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { FileSearch, Loader2, ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SortableTableHead, SortDirection } from "@/components/SortableTableHead";
import { WordCloud } from "@/components/WordCloud";
import { DateFilter } from "@/components/DateFilter";
import { TermFilter } from "@/components/TermFilter";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

type NewsResult = {
  id: string;
  title: string | null;
  snippet: string | null;
  link_url: string | null;
  term: string;
  created_at: string;
};

export default function ExtractedResults() {
  const { toast } = useToast();
  const [results, setResults] = useState<NewsResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({
    key: "created_at",
    direction: "desc",
  });
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [termFilter, setTermFilter] = useState("all");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_news_results")
        .select(`
          id,
          title,
          snippet,
          link_url,
          created_at,
          is_duplicate,
          alert_query_results!inner (
            search_terms!inner (
              term
            )
          )
        `)
        .eq("is_duplicate", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Group by title+link_url and keep only the one with smallest id (first occurrence)
      const uniqueMap = new Map<string, NewsResult>();
      for (const r of data || []) {
        const key = `${(r.title || "").toLowerCase().trim()}|${(r.link_url || "").toLowerCase().trim()}`;
        const existing = uniqueMap.get(key);
        if (!existing || r.id < existing.id) {
          uniqueMap.set(key, {
            id: r.id,
            title: r.title,
            snippet: r.snippet,
            link_url: r.link_url,
            term: r.alert_query_results?.search_terms?.term || "—",
            created_at: r.created_at,
          });
        }
      }

      setResults(Array.from(uniqueMap.values()));
    } catch (error) {
      console.error("Error loading results:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os resultados.",
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

  const handleWordCloudClick = (word: string) => {
    setWordCloudFilter(word);
    if (word) {
      setTitleFilter(word);
    } else {
      setTitleFilter("");
    }
  };

  const parseFilterDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  // Filter by term first (affects word cloud)
  const termFilteredResults = useMemo(() => {
    if (!termFilter || termFilter === "all") return results;
    return results.filter((r) => r.term.toLowerCase() === termFilter.toLowerCase());
  }, [results, termFilter]);

  const filteredAndSortedResults = useMemo(() => {
    let filtered = termFilteredResults;

    // Filter by title
    if (titleFilter.trim()) {
      filtered = filtered.filter((r) =>
        (r.title || "").toLowerCase().includes(titleFilter.toLowerCase().trim())
      );
    }

    // Filter by date
    const filterDate = parseFilterDate(dateFilter);
    if (filterDate) {
      filtered = filtered.filter((r) => {
        const newsDate = new Date(r.created_at);
        return (
          newsDate.getDate() === filterDate.getDate() &&
          newsDate.getMonth() === filterDate.getMonth() &&
          newsDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    // Sort
    if (!sort.direction) return filtered;

    return [...filtered].sort((a, b) => {
      let aVal = "";
      let bVal = "";

      if (sort.key === "term") {
        aVal = a.term.toLowerCase();
        bVal = b.term.toLowerCase();
      } else if (sort.key === "title") {
        aVal = (a.title || "").toLowerCase();
        bVal = (b.title || "").toLowerCase();
      } else if (sort.key === "created_at") {
        aVal = a.created_at;
        bVal = b.created_at;
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [results, sort, titleFilter, dateFilter, termFilter]);

  async function handleExtract() {
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("extract-news-results");

      if (error) throw error;

      toast({
        title: "Extração concluída",
        description: `${data?.extractedCount || 0} resultado(s) extraído(s).`,
      });

      await loadResults();
    } catch (error) {
      console.error("Error extracting results:", error);
      toast({
        title: "Erro",
        description: "Erro ao extrair resultados.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-primary">Passo 3</span> — Resultados Extraídos
              </CardTitle>
              <CardDescription>
                Extraia os resultados de notícias do HTML armazenado nas consultas.
              </CardDescription>
            </div>
            <Button onClick={handleExtract} disabled={isExtracting}>
              {isExtracting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileSearch className="w-4 h-4 mr-2" />
              )}
              Extrair resultados das consultas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum resultado extraído ainda. Execute as consultas e depois clique em "Extrair resultados".
            </p>
          ) : (
            <>
              <div className="flex items-center gap-4 mb-4">
                <TermFilter value={termFilter} onChange={setTermFilter} />
              </div>

              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Clique em uma palavra para filtrar:</p>
                <WordCloud
                  titles={termFilteredResults.map((r) => r.title)}
                  onWordClick={handleWordCloudClick}
                  activeWord={wordCloudFilter}
                />
              </div>

              <div className="flex items-center justify-between mb-4 gap-4">
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedResults.length} de {results.length} resultado(s)
                </p>
                <div className="flex items-center gap-2">
                  <DateFilter
                    value={dateFilter}
                    onChange={setDateFilter}
                    placeholder="dd/mm/aaaa"
                  />
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filtrar por título..."
                      value={titleFilter}
                      onChange={(e) => {
                        setTitleFilter(e.target.value);
                        setWordCloudFilter("");
                      }}
                      className="pl-9"
                      maxLength={100}
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHead
                        sortKey="created_at"
                        currentSort={sort}
                        onSort={handleSort}
                        className="w-[100px]"
                      >
                        Data
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="term"
                        currentSort={sort}
                        onSort={handleSort}
                        className="w-[120px]"
                      >
                        Termo
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="title"
                        currentSort={sort}
                        onSort={handleSort}
                      >
                        Título
                      </SortableTableHead>
                      <TableHead className="w-[100px]">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum resultado encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {format(new Date(result.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{result.term}</TableCell>
                          <TableCell className="font-medium text-sm">
                            {result.title || "—"}
                          </TableCell>
                          <TableCell>
                            {result.link_url ? (
                              <a
                                href={result.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Ver original
                              </a>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
