import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryFilterProps {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}

export function CategoryFilter({ value, options, onChange }: CategoryFilterProps) {
  const selectedSet = new Set(value);

  const toggleCategory = (category: string) => {
    if (selectedSet.has(category)) {
      onChange(value.filter((c) => c !== category));
      return;
    }
    onChange([...value, category]);
  };

  const clearCategories = () => onChange([]);

  const label = (() => {
    if (value.length === 0) return "Todas as categorias";
    if (value.length <= 2) return value.join(", ");
    return `${value.length} categorias`;
  })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between" disabled={options.length === 0}>
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Categorias</span>
          <Button variant="ghost" size="sm" onClick={clearCategories} disabled={value.length === 0}>
            Limpar
          </Button>
        </div>
        <ScrollArea className="h-48">
          <div className="space-y-1 pr-2">
            {options.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhuma categoria</div>
            ) : (
              options.map((cat) => (
                <label
                  key={cat}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                >
                  <Checkbox checked={selectedSet.has(cat)} onCheckedChange={() => toggleCategory(cat)} />
                  <span className="text-sm">{cat}</span>
                </label>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
