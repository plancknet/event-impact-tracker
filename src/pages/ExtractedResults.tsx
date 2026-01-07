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

type NewsResult = {
  id: string;
  title: string | null;
  snippet: string | null;
  link_url: string | null;
  term: string;
};

export default function ExtractedResults() {
  const { toast } = useToast();
  const [results, setResults] = useState<NewsResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [sort, setSort] = useState<{ key: string; direction: SortDirection }>({
    key: "term",
    direction: "asc",
  });
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState("");

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
          alert_query_results!inner (
            search_terms!inner (
              term
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedResults: NewsResult[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        snippet: r.snippet,
        link_url: r.link_url,
        term: r.alert_query_results?.search_terms?.term || "—",
      }));

      setResults(formattedResults);
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

  const filteredAndSortedResults = useMemo(() => {
    // First filter by title
    const filtered = titleFilter.trim()
      ? results.filter((r) =>
          (r.title || "").toLowerCase().includes(titleFilter.toLowerCase().trim())
        )
      : results;

    // Then sort
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
      }

      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [results, sort, titleFilter]);

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
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Clique em uma palavra para filtrar:</p>
                <WordCloud
                  titles={results.map((r) => r.title)}
                  onWordClick={handleWordCloudClick}
                  activeWord={wordCloudFilter}
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredAndSortedResults.length} de {results.length} resultado(s)
                </p>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
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
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          Nenhum resultado encontrado para "{titleFilter}"
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAndSortedResults.map((result) => (
                        <TableRow key={result.id}>
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
