
import { ArrowUp, ArrowDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { SortConfig } from "@/hooks/useTableSort";
import { cn } from "@/lib/utils";

interface SortableTableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  className?: string;
}

export default function SortableTableHeader({
  children,
  sortKey,
  sortConfig,
  onSort,
  className
}: SortableTableHeaderProps) {
  const getSortIcon = () => {
    if (sortConfig.key !== sortKey) {
      return null;
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    );
  };

  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center">
        {children}
        {getSortIcon()}
      </div>
    </TableHead>
  );
}
