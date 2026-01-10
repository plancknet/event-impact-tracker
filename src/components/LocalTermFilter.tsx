import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown } from "lucide-react";

interface LocalTermFilterProps {
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
}

export function LocalTermFilter({ value, options, onChange }: LocalTermFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleTerm = (term: string) => {
    if (value.includes(term)) {
      onChange(value.filter((t) => t !== term));
    } else {
      onChange([...value, term]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  if (options.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="min-w-[120px] justify-between">
          <span className="truncate">
            {value.length === 0 ? "Termo" : `${value.length} termo(s)`}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
          {options.map((term) => (
            <div
              key={term}
              className="flex items-center gap-2 p-1 rounded hover:bg-muted cursor-pointer"
              onClick={() => toggleTerm(term)}
            >
              <Checkbox checked={value.includes(term)} />
              <span className="text-sm truncate">{term}</span>
            </div>
          ))}
        </div>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2"
            onClick={clearAll}
          >
            Limpar
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
