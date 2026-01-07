import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SortableTableHead, type SortDirection } from "@/components/SortableTableHead";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

type SortField = "title" | "snippet" | "status";

type NewsResult = {
  id: string;
  title: string | null;
  snippet: string | null;
  link_url: string | null;
  is_duplicate: boolean;
  fullContent?: {
    id: string;
    status: string;
    content_full: string | null;
  } | null;
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

  // Run deduplication on mount
  const deduplicationMutation = useMutation({
    mutationFn: async () => {
      // Get all news results
      const { data: allNews, error } = await supabase
        .from("alert_news_results")
        .select("id, title, link_url");

      if (error) throw error;
      if (!allNews || allNews.length === 0) return;

      // Find duplicates based on title or link_url
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

      // Reset all to non-duplicate first
      await supabase
        .from("alert_news_results")
        .update({ is_duplicate: false })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      // Mark duplicates
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

  // Fetch unique news (is_duplicate = false) with their full content status
  const { data: newsResults = [], isLoading } = useQuery({
    queryKey: ["unique-news"],
    queryFn: async () => {
      const { data: news, error } = await supabase
        .from("alert_news_results")
        .select("id, title, snippet, link_url, is_duplicate")
        .eq("is_duplicate", false);

      if (error) throw error;

      // Get full content status for each news
      const { data: fullContents } = await supabase
        .from("full_news_content")
        .select("id, news_id, status, content_full");

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

      // Call edge function
      const { data, error } = await supabase.functions.invoke("fetch-news-content", {
        body: { url: news.link_url },
      });

      if (error) throw error;

      // Insert or update full content
      const existingContent = news.fullContent;
      
      if (existingContent) {
        await supabase
          .from("full_news_content")
          .update({
            status: data.success ? "success" : "error",
            content_full: data.success ? data.content : data.error,
            fetched_at: new Date().toISOString(),
          })
          .eq("id", existingContent.id);
      } else {
        await supabase.from("full_news_content").insert({
          news_id: newsId,
          status: data.success ? "success" : "error",
          content_full: data.success ? data.content : data.error,
        });
      }

      return { newsId, success: data.success };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unique-news"] });
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

  const sortedNews = useMemo(() => {
    return [...newsResults].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      if (currentSort.key === "status") {
        aVal = a.fullContent?.status || "pending";
        bVal = b.fullContent?.status || "pending";
      } else {
        const key = currentSort.key as "title" | "snippet";
        aVal = (a[key] || "").toLowerCase();
        bVal = (b[key] || "").toLowerCase();
      }

      if (currentSort.direction === "asc") {
        return aVal.localeCompare(bVal);
      }
      return bVal.localeCompare(aVal);
    });
  }, [newsResults, currentSort]);

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
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Passo 5 — Conteúdo Completo</h1>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground">
          {newsResults.length} notícias únicas encontradas
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedNews.size === newsResults.length && newsResults.length > 0}
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
                <SortableTableHead
                  sortKey="snippet"
                  currentSort={currentSort}
                  onSort={handleSort}
                >
                  Snippet
                </SortableTableHead>
                <TableHead>Link</TableHead>
                <SortableTableHead
                  sortKey="status"
                  currentSort={currentSort}
                  onSort={handleSort}
                >
                  Status
                </SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNews.map((news) => (
                <TableRow key={news.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedNews.has(news.id)}
                      onCheckedChange={() => toggleSelection(news.id)}
                    />
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate font-medium">
                    {news.title || "—"}
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate text-muted-foreground">
                    {news.snippet || "—"}
                  </TableCell>
                  <TableCell>
                    {news.link_url ? (
                      <a
                        href={news.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{getStatusIcon(news)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
