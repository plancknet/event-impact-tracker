import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

type SortableTableHeadProps = {
  children: React.ReactNode;
  sortKey: string;
  currentSort: { key: string; direction: SortDirection };
  onSort: (key: string) => void;
  className?: string;
};

export function SortableTableHead({
  children,
  sortKey,
  currentSort,
  onSort,
  className,
}: SortableTableHeadProps) {
  const isActive = currentSort.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <TableHead
      className={cn("cursor-pointer select-none hover:bg-muted/50 transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {children}
        {direction === "asc" ? (
          <ArrowUp className="w-4 h-4 text-primary" />
        ) : direction === "desc" ? (
          <ArrowDown className="w-4 h-4 text-primary" />
        ) : (
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
    </TableHead>
  );
}
