import { useState, useMemo } from "react";
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
  Square,
  ArrowUpDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { format, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { UserNewsItem } from "@/hooks/useUserNews";

interface NewsGridProps {
  newsItems: UserNewsItem[];
  isLoading: boolean;
  error: string | null;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRefresh: () => void;
}

type SortKey = "title" | "source" | "published_at";

type SortConfig = {
  key: SortKey;
  direction: "asc" | "desc";
};

export function NewsGrid({
  newsItems,
  isLoading,
  error,
  selectedIds,
  onSelectionChange,
  onRefresh,
}: NewsGridProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "published_at",
    direction: "desc",
  });

  const filteredNews = useMemo(() => {
    let items = newsItems;

    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query) ||
        item.source?.toLowerCase().includes(query)
      );
    }

    if (sourceFilter.trim()) {
      const query = sourceFilter.toLowerCase();
      items = items.filter((item) => item.source?.toLowerCase().includes(query));
    }

    if (showSelectedOnly) {
      const selectedSet = new Set(selectedIds);
      items = items.filter((item) => selectedSet.has(item.id));
    }

    return items;
  }, [newsItems, searchFilter, sourceFilter, showSelectedOnly, selectedIds]);

  const sortedNews = useMemo(() => {
    const sorted = [...filteredNews];
    const { key, direction } = sortConfig;
    sorted.sort((a, b) => {
      if (key === "published_at") {
        const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
        const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
        return direction === "asc" ? aTime - bTime : bTime - aTime;
      }

      const aValue = (a[key] ?? "").toString().toLowerCase();
      const bValue = (b[key] ?? "").toString().toLowerCase();
      return direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
    return sorted;
  }, [filteredNews, sortConfig]);

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

  const toggleSort = (key: SortKey) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (!isValid(date)) return "-";
    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  // Don't render if no news and not loading
  if (newsItems.length === 0 && !isLoading && !error) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors rounded-t-xl">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold">Notícias encontradas</h3>
              {newsItems.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.length}/{newsItems.length} selecionadas
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRefresh();
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
            {/* Filters and actions */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notícias..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Input
                placeholder="Filtrar por fonte"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="h-9 w-full sm:w-[180px]"
              />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={showSelectedOnly}
                  onCheckedChange={(checked) => setShowSelectedOnly(Boolean(checked))}
                />
                Somente selecionadas
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
                <span className="ml-2 text-muted-foreground">Buscando notícias...</span>
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <p className="text-center text-destructive py-4">{error}</p>
            )}

            {/* News grid */}
            {!isLoading && !error && (
              <div className="space-y-2">
                <div className="hidden md:grid grid-cols-[40px_2fr_1fr_1fr_2fr_36px] gap-3 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <div />
                  <button
                    type="button"
                    onClick={() => toggleSort("title")}
                    className="flex items-center gap-1 text-left"
                  >
                    Título
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("source")}
                    className="flex items-center gap-1 text-left"
                  >
                    Fonte
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("published_at")}
                    className="flex items-center gap-1 text-left"
                  >
                    Data
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                  <div>Resumo</div>
                  <div />
                </div>

                <div className="max-h-[420px] overflow-y-auto space-y-2">
                  {sortedNews.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma notícia encontrada
                    </p>
                  ) : (
                    sortedNews.map((item) => (
                      <div
                        key={item.id}
                        className={`grid grid-cols-1 gap-2 p-3 rounded-lg border cursor-pointer transition-colors md:grid-cols-[40px_2fr_1fr_1fr_2fr_36px] md:gap-3 md:items-start ${
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
                        <div className="text-sm font-medium leading-snug">
                          {item.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.source || "-"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(item.published_at)}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2">
                          {item.summary || "-"}
                        </div>
                        {item.link ? (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground mt-1 md:mt-0"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
