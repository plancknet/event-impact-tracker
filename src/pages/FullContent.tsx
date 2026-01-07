import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortableTableHead, type SortDirection } from "@/components/SortableTableHead";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ExternalLink, Eye, AlertCircle, ClipboardPaste, RefreshCw, Search } from "lucide-react";
import { WordCloud } from "@/components/WordCloud";

type SortField = "title" | "status";

type FullContent = {
  id: string;
  status: string;
  content_full: string | null;
  source_url: string | null;
  final_url: string | null;
  error_message: string | null;
  extractor: string | null;
};

type NewsResult = {
  id: string;
  title: string | null;
  snippet: string | null;
  link_url: string | null;
  is_duplicate: boolean;
  fullContent?: FullContent | null;
};

export default function FullContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNews, setSelectedNews] = useState<Set<string>>(new Set());
  const [currentSort, setCurrentSort] = useState<{ key: string; direction: SortDirection }>({
    key: "title",
    direction: "asc",
  });
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [deduplicationDone, setDeduplicationDone] = useState(false);
  const [viewingContent, setViewingContent] = useState<NewsResult | null>(null);
  const [viewingError, setViewingError] = useState<NewsResult | null>(null);
  const [manualInputNews, setManualInputNews] = useState<NewsResult | null>(null);
  const [manualContent, setManualContent] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState("");

  // Run deduplication on mount
  const deduplicationMutation = useMutation({
    mutationFn: async () => {
      const { data: allNews, error } = await supabase
        .from("alert_news_results")
        .select("id, title, link_url");

      if (error) throw error;
      if (!allNews || allNews.length === 0) return;

      const seen = new Map<string, string>();
      const duplicateIds: string[] = [];

      for (const news of allNews) {
        const key = (news.title?.toLowerCase().trim() || "") + "|" + (news.link_url?.toLowerCase().trim() || "");
        
        if (seen.has(key)) {
          duplicateIds.push(news.id);
        } else {
          seen.set(key, news.id);
        }
      }

      await supabase
        .from("alert_news_results")
        .update({ is_duplicate: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (duplicateIds.length > 0) {
        for (const id of duplicateIds) {
          await supabase
            .from("alert_news_results")
            .update({ is_duplicate: true })
            .eq("id", id);
        }
      }

      return duplicateIds.length;
    },
    onSuccess: (count) => {
      setDeduplicationDone(true);
      if (count && count > 0) {
        toast({
          title: "Deduplicação concluída",
          description: `${count} notícias duplicadas identificadas.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["unique-news"] });
    },
    onError: (error) => {
      console.error("Deduplication error:", error);
      toast({
        title: "Erro na deduplicação",
        description: "Não foi possível processar duplicatas.",
        variant: "destructive",
      });
      setDeduplicationDone(true);
    },
  });

  useEffect(() => {
    if (!deduplicationDone) {
      deduplicationMutation.mutate();
    }
  }, []);

  // Fetch unique news with full content status
  const { data: newsResults = [], isLoading } = useQuery({
    queryKey: ["unique-news"],
    queryFn: async () => {
      const { data: news, error } = await supabase
        .from("alert_news_results")
        .select("id, title, snippet, link_url, is_duplicate")
        .eq("is_duplicate", false);

      if (error) throw error;

      const { data: fullContents } = await supabase
        .from("full_news_content")
        .select("id, news_id, status, content_full, source_url, final_url, error_message, extractor");

      const contentMap = new Map(
        fullContents?.map((fc) => [fc.news_id, fc]) || []
      );

      return (news || []).map((n) => ({
        ...n,
        fullContent: contentMap.get(n.id) || null,
      })) as NewsResult[];
    },
    enabled: deduplicationDone,
  });

  const fetchContentMutation = useMutation({
    mutationFn: async (newsId: string) => {
      const news = newsResults.find((n) => n.id === newsId);
      if (!news?.link_url) throw new Error("URL não disponível");

      const { data, error } = await supabase.functions.invoke("fetch-news-content", {
        body: { url: news.link_url },
      });

      if (error) throw error;

      const existingContent = news.fullContent;
      const updateData = {
        status: data.success ? "success" : "error",
        content_full: data.success ? data.content : null,
        error_message: data.success ? null : data.error,
        source_url: data.sourceUrl || news.link_url,
        final_url: data.finalUrl,
        extractor: data.extractor || "simple",
        fetched_at: new Date().toISOString(),
      };
      
      if (existingContent) {
        await supabase
          .from("full_news_content")
          .update(updateData)
          .eq("id", existingContent.id);
      } else {
        await supabase.from("full_news_content").insert({
          news_id: newsId,
          ...updateData,
        });
      }

      return { newsId, success: data.success };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unique-news"] });
    },
  });

  const saveManualContentMutation = useMutation({
    mutationFn: async ({ newsId, content }: { newsId: string; content: string }) => {
      const news = newsResults.find((n) => n.id === newsId);
      if (!news) throw new Error("Notícia não encontrada");

      const existingContent = news.fullContent;
      const updateData = {
        status: "success",
        content_full: content,
        error_message: null,
        extractor: "manual",
        fetched_at: new Date().toISOString(),
      };
      
      if (existingContent) {
        await supabase
          .from("full_news_content")
          .update(updateData)
          .eq("id", existingContent.id);
      } else {
        await supabase.from("full_news_content").insert({
          news_id: newsId,
          source_url: news.link_url,
          ...updateData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unique-news"] });
      toast({ title: "Conteúdo salvo", description: "O conteúdo manual foi salvo com sucesso." });
      setManualInputNews(null);
      setManualContent("");
    },
    onError: (error) => {
      toast({ title: "Erro", description: "Não foi possível salvar o conteúdo.", variant: "destructive" });
    },
  });

  const handleFetchSelected = async () => {
    const ids = Array.from(selectedNews);
    setProcessingIds(new Set(ids));

    for (const id of ids) {
      try {
        await fetchContentMutation.mutateAsync(id);
      } catch (error) {
        console.error("Error fetching content for", id, error);
      }
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    toast({
      title: "Download concluído",
      description: `Conteúdo de ${ids.length} notícias processado.`,
    });
    setSelectedNews(new Set());
  };

  const handleReprocess = async (newsId: string) => {
    setProcessingIds((prev) => new Set(prev).add(newsId));
    try {
      await fetchContentMutation.mutateAsync(newsId);
    } catch (error) {
      console.error("Error reprocessing", newsId, error);
    }
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(newsId);
      return next;
    });
  };

  const toggleSelection = (id: string) => {
    setSelectedNews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedNews.size === newsResults.length) {
      setSelectedNews(new Set());
    } else {
      setSelectedNews(new Set(newsResults.map((n) => n.id)));
    }
  };

  const handleSort = (key: string) => {
    setCurrentSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleWordCloudClick = (word: string) => {
    setWordCloudFilter(word);
    setTitleFilter(word);
  };

  const filteredAndSortedNews = useMemo(() => {
    // Filter by title
    const filtered = titleFilter.trim()
      ? newsResults.filter((n) =>
          (n.title || "").toLowerCase().includes(titleFilter.toLowerCase().trim())
        )
      : newsResults;

    // Sort
    return [...filtered].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (currentSort.key === "status") {
        aVal = a.fullContent?.status || "pending";
        bVal = b.fullContent?.status || "pending";
      } else {
        aVal = (a.title || "").toLowerCase();
        bVal = (b.title || "").toLowerCase();
      }

      if (currentSort.direction === "asc") {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });
  }, [newsResults, currentSort, titleFilter]);

  const getStatusIcon = (news: NewsResult) => {
    if (processingIds.has(news.id)) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (news.fullContent?.status === "success") {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (news.fullContent?.status === "error") {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <span className="text-muted-foreground text-sm">—</span>;
  };

  if (!deduplicationDone || deduplicationMutation.isPending) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Passo 5 — Conteúdo Completo</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Executando deduplicação...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-bold">Passo 5 — Conteúdo Completo</h1>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          {filteredAndSortedNews.length} de {newsResults.length} notícias únicas
        </p>
        <Button
          onClick={handleFetchSelected}
          disabled={selectedNews.size === 0 || processingIds.size > 0}
        >
          {processingIds.size > 0 ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando ({processingIds.size} restantes)
            </>
          ) : (
            `Buscar conteúdo (${selectedNews.size})`
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : newsResults.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Nenhuma notícia disponível.
        </p>
      ) : (
        <>
          <div>
            <p className="text-xs text-muted-foreground mb-2">Clique em uma palavra para filtrar:</p>
            <WordCloud
              titles={newsResults.map((n) => n.title)}
              onWordClick={handleWordCloudClick}
              activeWord={wordCloudFilter}
            />
          </div>

          <div className="flex items-center justify-end">
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

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedNews.size === filteredAndSortedNews.length && filteredAndSortedNews.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <SortableTableHead
                    sortKey="title"
                    currentSort={currentSort}
                    onSort={handleSort}
                  >
                    Título
                  </SortableTableHead>
                  <TableHead>Link</TableHead>
                  <SortableTableHead
                    sortKey="status"
                    currentSort={currentSort}
                    onSort={handleSort}
                  >
                    Status
                  </SortableTableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedNews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma notícia encontrada para "{titleFilter}"
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedNews.map((news) => (
                    <TableRow key={news.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedNews.has(news.id)}
                          onCheckedChange={() => toggleSelection(news.id)}
                        />
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate font-medium">
                        {news.title || "—"}
                      </TableCell>
                      <TableCell>
                        {news.link_url ? (
                          <a
                            href={news.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Ver original
                          </a>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>{getStatusIcon(news)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {news.fullContent?.status === "success" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingContent(news)}
                              title="Ver conteúdo"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {news.fullContent?.status === "error" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewingError(news)}
                              title="Ver erro"
                            >
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                          {news.fullContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprocess(news.id)}
                              disabled={processingIds.has(news.id)}
                              title="Reprocessar"
                            >
                              <RefreshCw className={`h-4 w-4 ${processingIds.has(news.id) ? "animate-spin" : ""}`} />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setManualInputNews(news);
                              setManualContent(news.fullContent?.content_full || "");
                            }}
                            title="Colar conteúdo manualmente"
                          >
                            <ClipboardPaste className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* View Content Dialog */}
      <Dialog open={!!viewingContent} onOpenChange={() => setViewingContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="pr-8">{viewingContent?.title || "Conteúdo"}</DialogTitle>
          </DialogHeader>
          <div className="text-xs text-muted-foreground mb-2 space-y-1">
            {viewingContent?.fullContent?.final_url && (
              <p>
                URL final:{" "}
                <a
                  href={viewingContent.fullContent.final_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {viewingContent.fullContent.final_url}
                </a>
              </p>
            )}
            <p>
              Extrator: {viewingContent?.fullContent?.extractor || "—"} |{" "}
              {viewingContent?.fullContent?.content_full?.length?.toLocaleString() || 0} caracteres
            </p>
          </div>
          <ScrollArea className="h-[55vh] pr-4">
            <div className="whitespace-pre-wrap text-sm">
              {viewingContent?.fullContent?.content_full || "Sem conteúdo disponível."}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View Error Dialog */}
      <Dialog open={!!viewingError} onOpenChange={() => setViewingError(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-8 text-red-600">Erro na extração</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Título:</span>{" "}
              {viewingError?.title || "—"}
            </div>
            <div>
              <span className="font-medium">URL original:</span>{" "}
              <a
                href={viewingError?.fullContent?.source_url || viewingError?.link_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {viewingError?.fullContent?.source_url || viewingError?.link_url || "—"}
              </a>
            </div>
            {viewingError?.fullContent?.final_url && (
              <div>
                <span className="font-medium">URL final:</span>{" "}
                <a
                  href={viewingError.fullContent.final_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {viewingError.fullContent.final_url}
                </a>
              </div>
            )}
            <div>
              <span className="font-medium">Extrator usado:</span>{" "}
              {viewingError?.fullContent?.extractor || "—"}
            </div>
            <div className="bg-red-50 dark:bg-red-950 p-3 rounded border border-red-200 dark:border-red-800">
              <span className="font-medium text-red-700 dark:text-red-400">Erro:</span>{" "}
              <span className="text-red-600 dark:text-red-300">
                {viewingError?.fullContent?.error_message || "Erro desconhecido"}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setViewingError(null);
                if (viewingError) {
                  setManualInputNews(viewingError);
                  setManualContent("");
                }
              }}
            >
              <ClipboardPaste className="h-4 w-4 mr-2" />
              Colar conteúdo manualmente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Input Dialog */}
      <Dialog open={!!manualInputNews} onOpenChange={() => { setManualInputNews(null); setManualContent(""); }}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="pr-8">Colar conteúdo manualmente</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">
            <p className="font-medium">{manualInputNews?.title}</p>
            <p className="text-xs mt-1">
              Cole abaixo o texto completo do artigo (útil para sites com paywall).
            </p>
          </div>
          <Textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder="Cole o conteúdo completo do artigo aqui..."
            className="h-[45vh] resize-none"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setManualInputNews(null); setManualContent(""); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (manualInputNews && manualContent.trim()) {
                  saveManualContentMutation.mutate({ newsId: manualInputNews.id, content: manualContent.trim() });
                }
              }}
              disabled={!manualContent.trim() || saveManualContentMutation.isPending}
            >
              {saveManualContentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar conteúdo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
