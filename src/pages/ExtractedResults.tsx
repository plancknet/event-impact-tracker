import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { FileSearch, Loader2, ExternalLink } from "lucide-react";

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
    <div className="max-w-6xl mx-auto">
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
              <p className="text-sm text-muted-foreground mb-4">
                {results.length} resultado(s) encontrado(s)
              </p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Termo</TableHead>
                      <TableHead className="w-[250px]">Título</TableHead>
                      <TableHead>Snippet</TableHead>
                      <TableHead className="w-[80px]">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-mono text-xs">{result.term}</TableCell>
                        <TableCell className="font-medium text-sm">{result.title || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-md truncate">
                          {result.snippet || "—"}
                        </TableCell>
                        <TableCell>
                          {result.link_url ? (
                            <a
                              href={result.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
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
