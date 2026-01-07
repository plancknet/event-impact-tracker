import { useState, useMemo } from "react";
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
import { Loader2, CheckCircle2, XCircle, ExternalLink, Eye, AlertCircle, ClipboardPaste, RefreshCw, Search, Copy } from "lucide-react";
import { WordCloud } from "@/components/WordCloud";
import { DateFilter } from "@/components/DateFilter";
import { TermFilter } from "@/components/TermFilter";
import { CategoryFilter } from "@/components/CategoryFilter";
import { format, parse, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

type SortField = "title" | "status" | "created_at";

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
  created_at: string;
  term: string;
  categories: string | null;
  fullContent?: FullContent | null;
};

export default function FullContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedNews, setSelectedNews] = useState<Set<string>>(new Set());
  const [currentSort, setCurrentSort] = useState<{ key: string; direction: SortDirection }>({
    key: "created_at",
    direction: "desc",
  });
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [viewingContent, setViewingContent] = useState<NewsResult | null>(null);
  const [viewingError, setViewingError] = useState<NewsResult | null>(null);
  const [manualInputNews, setManualInputNews] = useState<NewsResult | null>(null);
  const [manualContent, setManualContent] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [wordCloudFilter, setWordCloudFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [termFilter, setTermFilter] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [isDeduplicating, setIsDeduplicating] = useState(false);

  // Deduplication mutation - now triggered by button
  const deduplicationMutation = useMutation({
    mutationFn: async () => {
      const { data: allNews, error } = await supabase
        .from("alert_news_results")
        .select("id, title, link_url");

      if (error) throw error;
      if (!allNews || allNews.length === 0) return 0;

      // Sort by id to ensure we keep the smallest PK
      const sortedNews = [...allNews].sort((a, b) => a.id.localeCompare(b.id));

      const seen = new Map<string, string>();
      const duplicateIds: string[] = [];

      for (const news of sortedNews) {
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
      setIsDeduplicating(false);
      toast({
        title: "Deduplicação concluída",
        description: `${count || 0} notícias duplicadas identificadas.`,
      });
      queryClient.invalidateQueries({ queryKey: ["unique-news"] });
    },
    onError: (error) => {
      console.error("Deduplication error:", error);
      toast({
        title: "Erro na deduplicação",
        description: "Não foi possível processar duplicatas.",
        variant: "destructive",
      });
      setIsDeduplicating(false);
    },
  });

  const handleDeduplicate = () => {
    setIsDeduplicating(true);
    deduplicationMutation.mutate();
  };

  // Fetch unique news with full content status
  const { data: newsResults = [], isLoading } = useQuery({
    queryKey: ["unique-news"],
    queryFn: async () => {
      const { data: news, error } = await supabase
        .from("alert_news_results")
        .select(`
          id, 
          title, 
          snippet, 
          link_url, 
          is_duplicate, 
          created_at,
          alert_query_results!inner (
            search_terms!inner (
              term
            )
          )
        `)
        .eq("is_duplicate", false)
        .order("id", { ascending: true });

      if (error) throw error;

      const { data: fullContents } = await supabase
        .from("full_news_content")
        .select("id, news_id, status, content_full, source_url, final_url, error_message, extractor");

      const newsIds = (news || []).map((n) => n.id);
      let analysisMap = new Map<string, string | null>();
      if (newsIds.length > 0) {
        const { data: analyses, error: analysisError } = await supabase
          .from("news_ai_analysis")
          .select("news_id, categories")
          .in("news_id", newsIds);

        if (analysisError) throw analysisError;
        analysisMap = new Map(analyses?.map((a) => [a.news_id, a.categories]) || []);
      }

      const contentMap = new Map(
        fullContents?.map((fc) => [fc.news_id, fc]) || []
      );

      // Group by title+link_url and keep only the one with smallest id
      const uniqueMap = new Map<string, NewsResult>();
      for (const n of news || []) {
        const key = `${(n.title || "").toLowerCase().trim()}|${(n.link_url || "").toLowerCase().trim()}`;
        const existing = uniqueMap.get(key);
        if (!existing || n.id < existing.id) {
          uniqueMap.set(key, {
            id: n.id,
            title: n.title,
            snippet: n.snippet,
            link_url: n.link_url,
            is_duplicate: n.is_duplicate,
            created_at: n.created_at,
            categories: analysisMap.get(n.id) || null,
            term: n.alert_query_results?.search_terms?.term || "—",
            fullContent: contentMap.get(n.id) || null,
          });
        }
      }

      return Array.from(uniqueMap.values());
    },
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
    if (selectedNews.size === filteredAndSortedNews.length) {
      setSelectedNews(new Set());
    } else {
      setSelectedNews(new Set(filteredAndSortedNews.map((n) => n.id)));
    }
  };

  const handleSort = (key: string) => {
    setCurrentSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleWordCloudClick = (word: string) => {
    setWordCloudFilter((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const parseFilterDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  // Filter by term first (affects word cloud)
  const termFilteredResults = useMemo(() => {
    if (termFilter.length === 0) return newsResults;
    const termSet = new Set(termFilter.map((t) => t.toLowerCase()));
    return newsResults.filter((n) => termSet.has(n.term.toLowerCase()));
  }, [newsResults, termFilter]);

  const filteredAndSortedNews = useMemo(() => {
    let filtered = termFilteredResults;

    // Filter by title
    if (titleFilter.trim()) {
      filtered = filtered.filter((n) =>
        (n.title || "").toLowerCase().includes(titleFilter.toLowerCase().trim())
      );
    }

    // Filter by word cloud selection
    if (wordCloudFilter.length > 0) {
      const words = wordCloudFilter.map((w) => w.toLowerCase());
      filtered = filtered.filter((n) =>
        words.some((word) => (n.title || "").toLowerCase().includes(word))
      );
    }

    // Filter by categories
    if (categoryFilter.length > 0) {
      const categorySet = new Set(categoryFilter.map((c) => c.toLowerCase()));
      filtered = filtered.filter((n) => {
        if (!n.categories) return false;
        const categories = n.categories
          .split(",")
          .map((c) => c.trim().toLowerCase())
          .filter(Boolean);
        return categories.some((c) => categorySet.has(c));
      });
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

    // Sort
    return [...filtered].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (currentSort.key === "status") {
        aVal = a.fullContent?.status || "pending";
        bVal = b.fullContent?.status || "pending";
      } else if (currentSort.key === "created_at") {
        aVal = a.created_at;
        bVal = b.created_at;
      } else {
        aVal = (a.title || "").toLowerCase();
        bVal = (b.title || "").toLowerCase();
      }

      if (currentSort.direction === "asc") {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });
  }, [newsResults, currentSort, titleFilter, dateFilter, termFilter, wordCloudFilter, categoryFilter]);

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const n of newsResults) {
      if (!n.categories) continue;
      n.categories
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
        .forEach((c) => set.add(c));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [newsResults]);

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

  return (
    <div className="container mx-auto py-8 space-y-4">
      <h1 className="text-2xl font-bold">Passo 5 — Conteúdo Completo</h1>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-muted-foreground">
          {filteredAndSortedNews.length} de {newsResults.length} notícias únicas
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDeduplicate}
            disabled={isDeduplicating || deduplicationMutation.isPending}
          >
            {isDeduplicating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deduplicando...
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Executar Deduplicação
              </>
            )}
          </Button>
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
          <div className="flex gap-4 mb-4">
            <div className="flex flex-col gap-2 w-[60%]">
              <div className="flex items-center gap-2">
                <TermFilter value={termFilter} onChange={setTermFilter} />
                <CategoryFilter
                  value={categoryFilter}
                  options={categoryOptions}
                  onChange={setCategoryFilter}
                />
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
                  }}
                  className="pl-9"
                  maxLength={100}
                />
              </div>
            </div>
            <div className="w-[40%]">
              <WordCloud
                compact
                titles={termFilteredResults.map((n) => n.title)}
                onWordClick={handleWordCloudClick}
                activeWords={wordCloudFilter}
                onClear={() => setWordCloudFilter([])}
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
                    sortKey="created_at"
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[100px]"
                  >
                    Data
                  </SortableTableHead>
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
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma notícia encontrada
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
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {format(new Date(news.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
                          {(news.fullContent?.status === "error" || news.fullContent?.status === "success") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReprocess(news.id)}
                              disabled={processingIds.has(news.id)}
                              title="Reprocessar"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setManualInputNews(news);
                              setManualContent(news.fullContent?.content_full || "");
                            }}
                            title="Inserir manualmente"
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
            <DialogTitle>{viewingContent?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="whitespace-pre-wrap text-sm">
              {viewingContent?.fullContent?.content_full}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* View Error Dialog */}
      <Dialog open={!!viewingError} onOpenChange={() => setViewingError(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erro ao extrair conteúdo</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-red-600">
            {viewingError?.fullContent?.error_message || "Erro desconhecido"}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Input Dialog */}
      <Dialog open={!!manualInputNews} onOpenChange={() => setManualInputNews(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Inserir conteúdo manualmente</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">{manualInputNews?.title}</p>
          <Textarea
            value={manualContent}
            onChange={(e) => setManualContent(e.target.value)}
            placeholder="Cole o conteúdo da notícia aqui..."
            className="min-h-[300px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualInputNews(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (manualInputNews && manualContent.trim()) {
                  saveManualContentMutation.mutate({
                    newsId: manualInputNews.id,
                    content: manualContent.trim(),
                  });
                }
              }}
              disabled={!manualContent.trim() || saveManualContentMutation.isPending}
            >
              {saveManualContentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
