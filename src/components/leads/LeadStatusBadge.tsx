import { cn } from "@/lib/utils";
import { LeadStatus, STATUS_LABELS, STATUS_COLORS, getStatusCategory } from "@/types/lead";

interface LeadStatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

export default function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  const category = getStatusCategory(status);
  const label = STATUS_LABELS[status];
  const colorClass = STATUS_COLORS[status];
  
  // Adicionar animação sutil para status de ação necessária
  const isActionRequired = category === 'acao_necessaria';
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        colorClass,
        isActionRequired && "animate-pulse",
        className
      )}
    >
      {label}
    </span>
  );
}
