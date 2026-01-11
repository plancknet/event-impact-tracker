import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ChipOption {
  value: string;
  label: string;
}

interface ChipSelectorProps {
  options: ChipOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  multiple?: boolean;
  maxSelections?: number;
}

export function ChipSelector({ 
  options, 
  selected, 
  onChange, 
  multiple = false,
  maxSelections
}: ChipSelectorProps) {
  const handleSelect = (value: string) => {
    if (multiple) {
      if (selected.includes(value)) {
        onChange(selected.filter(v => v !== value));
      } else if (!maxSelections || selected.length < maxSelections) {
        onChange([...selected, value]);
      }
    } else {
      onChange([value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        const isDisabled = multiple && maxSelections && 
          selected.length >= maxSelections && !isSelected;
        
        return (
          <button
            key={option.value}
            type="button"
            disabled={isDisabled}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
              "border transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected 
                ? "bg-primary text-primary-foreground border-primary" 
                : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent/50",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
