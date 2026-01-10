import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, isValid, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckSquare, Square, Search } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { DateFilter } from "@/components/DateFilter";

export interface SelectableNews {
  id: string;
  title: string;
  date: Date;
  publishedAt?: Date | null;
  source: string;
  linkUrl?: string | null;
  summary?: string;
  content?: string;
  term?: string | null;
  categories?: string[];
}

interface NewsSelectorProps {
  news: SelectableNews[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function NewsSelector({ news, selectedIds, onSelectionChange }: NewsSelectorProps) {
  const [titleWordFilter, setTitleWordFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [publishedDateFilter, setPublishedDateFilter] = useState("");

  const parseFilterDate = (dateStr: string): Date | null => {
    if (dateStr.length !== 10) return null;
    const parsed = parse(dateStr, "dd/MM/yyyy", new Date());
    return isValid(parsed) ? parsed : null;
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const item of news) {
      if (!item.categories) continue;
      item.categories.forEach((cat) => {
        if (cat.trim()) set.add(cat.trim());
      });
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [news]);

  const filteredNews = useMemo(() => {
    let filtered = news;

    if (categoryFilter.length > 0) {
      const categorySet = new Set(categoryFilter.map((c) => c.toLowerCase()));
      filtered = filtered.filter((item) => {
        if (!item.categories || item.categories.length === 0) return false;
        return item.categories.some((cat) => categorySet.has(cat.toLowerCase()));
      });
    }

    if (titleWordFilter.trim()) {
      const query = titleWordFilter.toLowerCase().trim();
      filtered = filtered.filter((item) =>
        item.title.toLowerCase().includes(query)
      );
    }
    const creationFilterDate = parseFilterDate(dateFilter);
    if (creationFilterDate) {
      filtered = filtered.filter((item) => {
        const newsDate = item.date;
        return (
          newsDate.getDate() === creationFilterDate.getDate() &&
          newsDate.getMonth() === creationFilterDate.getMonth() &&
          newsDate.getFullYear() === creationFilterDate.getFullYear()
        );
      });
    }

    const publicationFilterDate = parseFilterDate(publishedDateFilter);
    if (publicationFilterDate) {
      filtered = filtered.filter((item) => {
        if (!item.publishedAt) return false;
        return (
          item.publishedAt.getDate() === publicationFilterDate.getDate() &&
          item.publishedAt.getMonth() === publicationFilterDate.getMonth() &&
          item.publishedAt.getFullYear() === publicationFilterDate.getFullYear()
        );
      });
    }
    return filtered;
  }, [news, categoryFilter, titleWordFilter, dateFilter, publishedDateFilter]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    const allFilteredIds = filteredNews.map(n => n.id);
    const newSelection = [...new Set([...selectedIds, ...allFilteredIds])];
    onSelectionChange(newSelection);
  };

  const handleDeselectAll = () => {
    const filteredIds = new Set(filteredNews.map(n => n.id));
    onSelectionChange(selectedIds.filter(id => !filteredIds.has(id)));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Selecionar Notícias</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selecionada(s)
            </span>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              <CheckSquare className="w-4 h-4 mr-1" />
              Todas
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              <Square className="w-4 h-4 mr-1" />
              Nenhuma
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <CategoryFilter
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
          />
          <DateFilter
            value={dateFilter}
            onChange={setDateFilter}
            placeholder="Criacao dd/mm/aaaa"
          />
          
          <DateFilter
            value={publishedDateFilter}
            onChange={setPublishedDateFilter}
            placeholder="Publicacao dd/mm/aaaa"
          />
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Palavra no titulo..."
              value={titleWordFilter}
              onChange={(e) => setTitleWordFilter(e.target.value)}
              className="pl-10"
              maxLength={100}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>Criacao: {format(item.date, "dd/MM/yyyy", { locale: ptBR })}</span>
                    {item.publishedAt && (
                      <span>Publicacao: {format(item.publishedAt, "dd/MM/yyyy", { locale: ptBR })}</span>
                    )}
                    <span>•</span>
                    <span className="truncate">{item.source}</span>
                  </div>
                  {item.summary && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {item.summary}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
