import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface OptionCardProps {
  label: string;
  description?: string;
  icon?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function OptionCard({ 
  label, 
  description, 
  icon,
  selected, 
  onClick,
  compact = false
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start text-left rounded-xl border-2 transition-all duration-200",
        "hover:border-primary/50 hover:bg-accent/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        compact ? "p-3 gap-1" : "p-4 gap-2",
        selected 
          ? "border-primary bg-accent shadow-sm" 
          : "border-border bg-card"
      )}
    >
      {/* Selection indicator */}
      {selected && (
        <div className="absolute top-2 right-2">
          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
      )}
      
      {/* Icon */}
      {icon && (
        <span className={cn("text-xl", compact && "text-lg")}>{icon}</span>
      )}
      
      {/* Label */}
      <span className={cn(
        "font-medium leading-tight",
        compact ? "text-sm" : "text-base",
        selected && "text-primary"
      )}>
        {label}
      </span>
      
      {/* Description */}
      {description && (
        <span className={cn(
          "text-muted-foreground leading-snug",
          compact ? "text-xs" : "text-sm"
        )}>
          {description}
        </span>
      )}
    </button>
  );
}
