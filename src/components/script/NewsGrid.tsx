import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DateFilter } from "@/components/DateFilter";
import { SortableTableHead, type SortDirection } from "@/components/SortableTableHead";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { format, isValid, parse } from "date-fns";
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

export function NewsGrid({ 
  newsItems, 
  isLoading, 
  error, 
  selectedIds, 
  onSelectionChange,
  onRefresh 
}: NewsGridProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [publishedDateFilter, setPublishedDateFilter] = useState("");
  const [currentSort, setCurrentSort] = useState<{ key: "title" | "published_at"; direction: SortDirection }>({
    key: "published_at",
    direction: "desc",
  });

  const filteredNews = useMemo(() => {
    let filtered = newsItems;
    if (searchFilter.trim()) {
      const query = searchFilter.toLowerCase();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.summary?.toLowerCase().includes(query)
      );
    }

    const publishedFilterDate = parseFilterDate(publishedDateFilter);
    if (publishedFilterDate) {
      filtered = filtered.filter((item) => {
        if (!item.published_at) return false;
        const publishedDate = new Date(item.published_at);
        return (
          publishedDate.getDate() === publishedFilterDate.getDate() &&
          publishedDate.getMonth() === publishedFilterDate.getMonth() &&
          publishedDate.getFullYear() === publishedFilterDate.getFullYear()
        );
      });
    }

    return [...filtered].sort((a, b) => {
      if (currentSort.key === "published_at") {
        const aVal = a.published_at || "";
        const bVal = b.published_at || "";
        return currentSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const aVal = a.title.toLowerCase();
      const bVal = b.title.toLowerCase();
      return currentSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
  }, [newsItems, searchFilter, publishedDateFilter, currentSort]);

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
    return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  const parseFilterDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  const handleSort = (key: "title" | "published_at") => {
    setCurrentSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const allFilteredSelected =
    filteredNews.length > 0 && filteredNews.every((item) => selectedIds.includes(item.id));

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
            {/* Search and actions */}
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
              <DateFilter
                value={publishedDateFilter}
                onChange={setPublishedDateFilter}
                placeholder="Publicação dd/mm/aaaa"
              />
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

            {/* News list */}
            {!isLoading && !error && (
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={allFilteredSelected}
                          onCheckedChange={() =>
                            allFilteredSelected ? handleDeselectAll() : handleSelectAll()
                          }
                        />
                      </TableHead>
                      <SortableTableHead
                        sortKey="published_at"
                        currentSort={currentSort}
                        onSort={handleSort}
                        className="w-[160px]"
                      >
                        Publica??o
                      </SortableTableHead>
                      <SortableTableHead
                        sortKey="title"
                        currentSort={currentSort}
                        onSort={handleSort}
                      >
                        T?tulo
                      </SortableTableHead>
                      <TableHead className="w-[160px]">Fonte</TableHead>
                      <TableHead className="w-[80px]">Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNews.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhuma not?cia encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredNews.map((item) => (
                        <TableRow
                          key={item.id}
                          className={`cursor-pointer ${
                            selectedIds.includes(item.id) ? "bg-primary/5" : "hover:bg-muted/50"
                          }`}
                          onClick={() => handleToggle(item.id)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.includes(item.id)}
                              onClick={(event) => event.stopPropagation()}
                              onCheckedChange={() => handleToggle(item.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs whitespace-nowrap">
                            {formatDate(item.published_at) ?? "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.title}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {item.source || "-"}
                          </TableCell>
                          <TableCell>
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-foreground inline-flex items-center"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
