
import { cn } from "@/lib/utils";
import { SubstatusPedidoAgendado } from "@/types";

interface SubstatusBadgeProps {
  substatus?: SubstatusPedidoAgendado;
  className?: string;
}

export default function SubstatusBadge({ substatus, className }: SubstatusBadgeProps) {
  if (!substatus) return null;
  
  const getBadgeStyles = (substatus: SubstatusPedidoAgendado) => {
    switch (substatus) {
      case "Agendado":
        return "bg-blue-500 hover:bg-blue-600";
      case "Separado":
        return "bg-amber-500 hover:bg-amber-600";
      case "Despachado":
        return "bg-purple-500 hover:bg-purple-600";
      case "Entregue":
        return "bg-green-600 hover:bg-green-700";
      case "Retorno":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-white",
        getBadgeStyles(substatus),
        className
      )}
    >
      {substatus}
    </span>
  );
}
