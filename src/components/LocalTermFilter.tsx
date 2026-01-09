import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocalTermFilterProps {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}

export function LocalTermFilter({ value, options, onChange }: LocalTermFilterProps) {
  const selectedSet = new Set(value);

  const toggleTerm = (term: string) => {
    if (selectedSet.has(term)) {
      onChange(value.filter((t) => t !== term));
      return;
    }
    onChange([...value, term]);
  };

  const clearTerms = () => onChange([]);

  const label = (() => {
    if (value.length === 0) return "Todos os termos";
    if (value.length <= 2) return value.join(", ");
    return `${value.length} termos`;
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
          <span className="text-sm font-medium">Termos</span>
          <Button variant="ghost" size="sm" onClick={clearTerms} disabled={value.length === 0}>
            Limpar
          </Button>
        </div>
        <ScrollArea className="h-48">
          <div className="space-y-1 pr-2">
            {options.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nenhum termo</div>
            ) : (
              options.map((term) => (
                <label
                  key={term}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted cursor-pointer"
                >
                  <Checkbox checked={selectedSet.has(term)} onCheckedChange={() => toggleTerm(term)} />
                  <span className="text-sm">{term}</span>
                </label>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
