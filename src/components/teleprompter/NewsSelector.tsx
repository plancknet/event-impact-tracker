import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckSquare, Square, Search } from "lucide-react";

export interface SelectableNews {
  id: string;
  title: string;
  date: Date;
  source: string;
  summary?: string;
  content?: string;
}

interface NewsSelectorProps {
  news: SelectableNews[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function NewsSelector({ news, selectedIds, onSelectionChange }: NewsSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNews = news.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar notícias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{format(item.date, "dd/MM/yyyy", { locale: ptBR })}</span>
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
