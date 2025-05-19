
import { cn } from "@/lib/utils";
import { SubstatusPedidoAgendado } from "@/types";

interface SubstatusBadgeProps {
  substatus?: SubstatusPedidoAgendado;
  className?: string;
  statusPrincipal?: string; // Add this to check for duplicates
}

export default function SubstatusBadge({ substatus, className, statusPrincipal }: SubstatusBadgeProps) {
  // If no substatus or if substatus is the same as main status, don't render
  if (!substatus || substatus === statusPrincipal) return null;
  
  const getBadgeStyles = (substatus: SubstatusPedidoAgendado) => {
    switch (substatus) {
      case "Agendado":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "Separado":
        return "bg-amber-100 text-amber-800 hover:bg-amber-200";
      case "Despachado":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "Entregue":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "Retorno":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
        getBadgeStyles(substatus),
        className
      )}
    >
      {substatus}
    </span>
  );
}
