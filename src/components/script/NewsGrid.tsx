import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Search, 
  RefreshCw, 
  ChevronDown,
  ExternalLink,
  CheckSquare,
  Square
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

interface NewsItem {
  id: string;
  title: string;
  link?: string;
  publishedAt?: string;
  source?: string;
  summary?: string;
}

interface NewsGridProps {
  topic: string;
  language: string;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function NewsGrid({ topic, language, selectedIds, onSelectionChange }: NewsGridProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");

  const fetchNews = async () => {
    if (!topic.trim()) {
      setError("Defina um tema principal no seu perfil.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the google-news-rss edge function
      const { data, error: fetchError } = await supabase.functions.invoke('google-news-rss', {
        body: {
          query: topic,
          language: language || 'pt-BR',
          maxResults: 20,
        },
      });

      if (fetchError) throw fetchError;

      const items: NewsItem[] = (data?.items || []).map((item: any, index: number) => ({
        id: item.id || `news-${index}-${Date.now()}`,
        title: item.title,
        link: item.link,
        publishedAt: item.publishedAt,
        source: item.source,
        summary: item.snippet || item.summary,
      }));

      setNewsItems(items);
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("Não foi possível carregar as notícias. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (topic.trim()) {
      fetchNews();
    }
  }, [topic, language]);

  const filteredNews = useMemo(() => {
    if (!searchFilter.trim()) return newsItems;
    const query = searchFilter.toLowerCase();
    return newsItems.filter((item) =>
      item.title.toLowerCase().includes(query) ||
      item.summary?.toLowerCase().includes(query)
    );
  }, [newsItems, searchFilter]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allIds = filteredNews.map((n) => n.id);
    const newSelection = [...new Set([...selectedIds, ...allIds])];
    onSelectionChange(newSelection);
  };

  const handleDeselectAll = () => {
    const filteredIds = new Set(filteredNews.map((n) => n.id));
    onSelectionChange(selectedIds.filter((id) => !filteredIds.has(id)));
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (!isValid(date)) return null;
    return format(date, "dd/MM", { locale: ptBR });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Notícias</h3>
              {newsItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.length}/{newsItems.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fetchNews();
                }}
                disabled={isLoading}
                className="h-8 px-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="border-t p-4 space-y-4">
            {/* Search and actions */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notícias..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSelectAll} className="h-9">
                <CheckSquare className="w-4 h-4 mr-1" />
                Todas
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeselectAll} className="h-9">
                <Square className="w-4 h-4 mr-1" />
                Nenhuma
              </Button>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Carregando notícias...</span>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <p className="text-center text-destructive py-4">{error}</p>
            )}

            {/* News list */}
            {!isLoading && !error && (
              <div className="max-h-[400px] overflow-y-auto space-y-2">
                {filteredNews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma notícia encontrada
                  </p>
                ) : (
                  filteredNews.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIds.includes(item.id)
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleToggle(item.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => handleToggle(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          {item.publishedAt && (
                            <span>{formatDate(item.publishedAt)}</span>
                          )}
                          {item.source && (
                            <>
                              <span>•</span>
                              <span className="truncate">{item.source}</span>
                            </>
                          )}
                        </div>
                        {item.summary && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.summary}
                          </p>
                        )}
                      </div>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
