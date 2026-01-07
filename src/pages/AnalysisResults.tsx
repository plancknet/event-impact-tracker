import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { Brain, ChevronDown, ChevronRight, ExternalLink, Loader2, CheckCircle, XCircle, Search } from "lucide-react";
import { WordCloud } from "@/components/WordCloud";
import { DateFilter } from "@/components/DateFilter";
import { TermFilter } from "@/components/TermFilter";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NewsWithContent {
  id: string;
  title: string | null;
  snippet: string | null;
  link_url: string | null;
  full_content_id: string;
  content_full: string | null;
  has_analysis: boolean;
  created_at: string;
  term: string;
  analysis?: {
    id: string;
    summary: string | null;
    categories: string | null;
    region: string | null;
    impact_asset_class: string | null;
    impact_direction: string | null;
    confidence_score: number | null;
    selected_for_model: boolean;
    model_variables_json: string | null;
    raw_ai_response: string | null;
    analyzed_at: string;
    ai_model: string;
  };
}

export default function AnalysisResults() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [termFilter, setTermFilter] = useState("all");
  const queryClient = useQueryClient();

  // Fetch news with successful content and analysis status
  const { data: newsItems, isLoading } = useQuery({
    queryKey: ["news-for-analysis"],
    queryFn: async () => {
      // Get news with successful full content
      const { data: fullContent, error: contentError } = await supabase
        .from("full_news_content")
        .select(`
          id,
          news_id,
          content_full,
          alert_news_results!inner (
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
          )
        `)
        .eq("status", "success")
        .not("content_full", "is", null);

      if (contentError) throw contentError;

      // Get existing analyses
      const { data: analyses, error: analysisError } = await supabase
        .from("news_ai_analysis")
        .select("*");

      if (analysisError) throw analysisError;

      const analysisMap = new Map(analyses?.map((a) => [a.news_id, a]) || []);

      // Transform data and filter duplicates - keep smallest id
      const uniqueMap = new Map<string, NewsWithContent>();
      
      for (const fc of fullContent || []) {
        if (!fc.alert_news_results) continue;
        if (fc.alert_news_results.is_duplicate) continue;

        const news = fc.alert_news_results as {
          id: string;
          title: string | null;
          snippet: string | null;
          link_url: string | null;
          created_at: string;
          alert_query_results: { search_terms: { term: string } };
        };
        
        const key = `${(news.title || "").toLowerCase().trim()}|${(news.link_url || "").toLowerCase().trim()}`;
        const existing = uniqueMap.get(key);
        
        if (!existing || news.id < existing.id) {
          const analysis = analysisMap.get(news.id);
          
          uniqueMap.set(key, {
            id: news.id,
            title: news.title,
            snippet: news.snippet,
            link_url: news.link_url,
            full_content_id: fc.id,
            content_full: fc.content_full,
            has_analysis: !!analysis,
            created_at: news.created_at,
            term: news.alert_query_results?.search_terms?.term || "—",
            analysis: analysis ? {
              id: analysis.id,
              summary: analysis.summary,
              categories: analysis.categories,
              region: analysis.region,
              impact_asset_class: analysis.impact_asset_class,
              impact_direction: analysis.impact_direction,
              confidence_score: analysis.confidence_score,
              selected_for_model: analysis.selected_for_model,
              model_variables_json: analysis.model_variables_json,
              raw_ai_response: analysis.raw_ai_response,
              analyzed_at: analysis.analyzed_at,
              ai_model: analysis.ai_model,
            } : undefined,
          });
        }
      }

      return Array.from(uniqueMap.values());
    },
  });

  // Analyze mutation
  const analyzeMutation = useMutation({
    mutationFn: async (items: NewsWithContent[]) => {
      const newsPayload = items.map((item) => ({
        newsId: item.id,
        fullContentId: item.full_content_id,
        title: item.title,
        snippet: item.snippet,
        linkUrl: item.link_url,
        contentFull: item.content_full,
      }));

      const { data, error } = await supabase.functions.invoke("analyze-news", {
        body: { newsItems: newsPayload },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const { summary } = data;
      if (summary.failed > 0) {
        toast.warning(`Análise concluída: ${summary.success} sucesso, ${summary.failed} falhas`);
      } else {
        toast.success(`${summary.success} notícias analisadas com sucesso!`);
      }
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["news-for-analysis"] });
    },
    onError: (error) => {
      console.error("Analysis error:", error);
      toast.error("Erro ao analisar notícias: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    },
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const selectAll = () => {
    if (!filteredNewsItems) return;
    const notAnalyzed = filteredNewsItems.filter((n) => !n.has_analysis);
    setSelectedIds(new Set(notAnalyzed.map((n) => n.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleAnalyze = () => {
    if (!newsItems || selectedIds.size === 0) return;
    const itemsToAnalyze = newsItems.filter((n) => selectedIds.has(n.id));
    analyzeMutation.mutate(itemsToAnalyze);
  };

  const getDirectionBadge = (direction: string | null) => {
    switch (direction) {
      case "bullish":
        return <Badge className="bg-green-500">Bullish</Badge>;
      case "bearish":
        return <Badge className="bg-red-500">Bearish</Badge>;
      case "neutral":
        return <Badge variant="secondary">Neutral</Badge>;
      default:
        return null;
    }
  };

  const handleWordCloudClick = (word: string) => {
    setWordCloudFilter(word);
    setTitleFilter(word);
  };

  const parseFilterDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  // Filter by term first (affects word cloud)
  const termFilteredItems = useMemo(() => {
    if (!newsItems) return [];
    if (!termFilter || termFilter === "all") return newsItems;
    return newsItems.filter((n) => n.term.toLowerCase() === termFilter.toLowerCase());
  }, [newsItems, termFilter]);

  const filteredNewsItems = useMemo(() => {
    let filtered = termFilteredItems;

    // Filter by title
    if (titleFilter.trim()) {
      filtered = filtered.filter((n) =>
        (n.title || "").toLowerCase().includes(titleFilter.toLowerCase().trim())
      );
    }

    // Filter by date
    const filterDate = parseFilterDate(dateFilter);
    if (filterDate) {
      filtered = filtered.filter((n) => {
        const newsDate = new Date(n.created_at);
        return (
          newsDate.getDate() === filterDate.getDate() &&
          newsDate.getMonth() === filterDate.getMonth() &&
          newsDate.getFullYear() === filterDate.getFullYear()
        );
      });
    }

    return filtered;
  }, [newsItems, titleFilter, dateFilter, termFilter]);

  const notAnalyzedCount = filteredNewsItems.filter((n) => !n.has_analysis).length;
  const analyzedCount = filteredNewsItems.filter((n) => n.has_analysis).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Passo 6 – Análise e Resumo das Notícias
          </h1>
          <p className="text-muted-foreground mt-1">
            Selecione notícias para análise com IA (Passos 6, 7, 9 e 10)
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center flex-wrap">
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{newsItems?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Notícias com conteúdo</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{analyzedCount}</div>
            <p className="text-sm text-muted-foreground">Já analisadas</p>
          </CardContent>
        </Card>
        <Card className="flex-1 min-w-[200px]">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{notAnalyzedCount}</div>
            <p className="text-sm text-muted-foreground">Pendentes de análise</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notícias para Análise</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Selecionar não analisadas
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Desmarcar todas
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={selectedIds.size === 0 || analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analisar selecionadas ({selectedIds.size})
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !newsItems || newsItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma notícia com conteúdo completo disponível.
              <br />
              Primeiro extraia o conteúdo completo na página "Conteúdo Completo".
            </div>
          ) : (
            <>
              <div className="flex gap-4 mb-4">
                <div className="flex flex-col gap-2 w-[70%]">
                  <div className="flex items-center gap-2">
                    <TermFilter value={termFilter} onChange={setTermFilter} />
                    <DateFilter
                      value={dateFilter}
                      onChange={setDateFilter}
                      placeholder="dd/mm/aaaa"
                    />
                  </div>
                  <div className="relative">
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
                  <p className="text-sm text-muted-foreground">
                    {filteredNewsItems.length} de {newsItems.length} notícias
                  </p>
                </div>
                <div className="w-[30%]">
                  <WordCloud
                    compact
                    titles={termFilteredItems.map((n) => n.title)}
                    onWordClick={handleWordCloudClick}
                    activeWord={wordCloudFilter}
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-[100px]">Data</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-24">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNewsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma notícia encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredNewsItems.map((item) => (
                  <Collapsible key={item.id} asChild>
                    <>
                      <TableRow className={expandedIds.has(item.id) ? "border-b-0" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleSelect(item.id)}
                            disabled={analyzeMutation.isPending}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium line-clamp-2">{item.title || "Sem título"}</div>
                            {item.link_url && (
                              <a
                                href={item.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver original
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.has_analysis ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-sm">Analisada</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-yellow-600">
                              <XCircle className="h-4 w-4" />
                              <span className="text-sm">Pendente</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.has_analysis && (
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpand(item.id)}
                              >
                                {expandedIds.has(item.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          )}
                        </TableCell>
                      </TableRow>
                      {item.has_analysis && item.analysis && (
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={5} className="p-4">
                              <AnalysisDetail analysis={item.analysis} />
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      )}
                    </>
                  </Collapsible>
                    ))
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AnalysisDetail({ analysis }: { analysis: NonNullable<NewsWithContent["analysis"]> }) {
  const [showRawJson, setShowRawJson] = useState(false);

  const getDirectionBadge = (direction: string | null) => {
    switch (direction) {
      case "bullish":
        return <Badge className="bg-green-500">Bullish</Badge>;
      case "bearish":
        return <Badge className="bg-red-500">Bearish</Badge>;
      case "neutral":
        return <Badge variant="secondary">Neutral</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  let modelVars: Record<string, number> | null = null;
  try {
    if (analysis.model_variables_json) {
      modelVars = JSON.parse(analysis.model_variables_json);
    }
  } catch {
    // ignore parse errors
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Resumo (Passo 7)</h4>
          <p className="text-sm text-muted-foreground">{analysis.summary || "N/A"}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Direção:</span>
            {getDirectionBadge(analysis.impact_direction)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confiança:</span>
            <Badge variant="outline">
              {analysis.confidence_score !== null 
                ? `${(analysis.confidence_score * 100).toFixed(0)}%` 
                : "N/A"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Região:</span>
            <span className="text-sm text-muted-foreground">{analysis.region || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Classe de Ativo:</span>
            <span className="text-sm text-muted-foreground">{analysis.impact_asset_class || "N/A"}</span>
          </div>
        </div>
      </div>

      {analysis.categories && (
        <div>
          <h4 className="font-semibold mb-2">Categorias</h4>
          <div className="flex flex-wrap gap-1">
            {analysis.categories.split(",").map((cat, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {cat.trim()}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {modelVars && (
        <div>
          <h4 className="font-semibold mb-2">Variáveis do Modelo (Passo 9)</h4>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {Object.entries(modelVars).map(([key, value]) => (
              <div key={key} className="text-center p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">{key}</div>
                <div className="font-mono text-sm">{typeof value === "number" ? value.toFixed(2) : value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowRawJson(!showRawJson)}
        >
          {showRawJson ? "Ocultar" : "Mostrar"} resposta bruta da IA
        </Button>
        {showRawJson && (
          <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto max-h-64">
            {analysis.raw_ai_response}
          </pre>
        )}
      </div>
    </div>
  );
}
