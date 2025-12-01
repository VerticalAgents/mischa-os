
import { ArrowUp, ArrowDown, HelpCircle } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { SortConfig } from "@/hooks/useTableSort";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExplicacaoCalculoProps } from "@/components/common/TooltipExplicativo";

interface SortableTableHeaderProps {
  children: React.ReactNode;
  sortKey: string;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  className?: string;
  tooltip?: ExplicacaoCalculoProps;
}

export default function SortableTableHeader({
  children,
  sortKey,
  sortConfig,
  onSort,
  className,
  tooltip
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

  const content = (
    <div className="flex items-center">
      {children}
      {tooltip && <HelpCircle className="ml-1 h-3 w-3 text-muted-foreground" />}
      {getSortIcon()}
    </div>
  );

  if (tooltip) {
    return (
      <TableHead 
        className={cn(
          "cursor-pointer select-none hover:bg-muted/50",
          className
        )}
        onClick={() => onSort(sortKey)}
      >
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                {content}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm p-4 space-y-2" sideOffset={8}>
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{tooltip.titulo}</h4>
                <p className="text-xs leading-relaxed">{tooltip.explicacao}</p>
                {tooltip.formula && (
                  <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                    <strong>Fórmula:</strong> {tooltip.formula}
                  </div>
                )}
                {tooltip.exemplo && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-2 rounded text-xs">
                    <strong>Exemplo:</strong> {tooltip.exemplo}
                  </div>
                )}
                {tooltip.observacoes && tooltip.observacoes.length > 0 && (
                  <div>
                    <strong className="text-xs">Observações:</strong>
                    <ul className="text-xs mt-1 space-y-1">
                      {tooltip.observacoes.map((obs, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-muted-foreground">•</span>
                          <span>{obs}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableHead>
    );
  }

  return (
    <TableHead 
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      {content}
    </TableHead>
  );
}
