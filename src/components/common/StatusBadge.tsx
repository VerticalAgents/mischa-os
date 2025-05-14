
import { StatusCliente, StatusPedido } from "@/types";
import { cn } from "@/lib/utils";

type StatusBadgeProps = {
  status: StatusCliente | StatusPedido;
  size?: "sm" | "md";
  className?: string;
};

export default function StatusBadge({ status, size = "md", className }: StatusBadgeProps) {
  // Definir as classes base para o tamanho
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-xs"
  };
  
  // Definir as classes específicas para cada status de cliente
  const clienteStatusClasses = {
    "Ativo": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    "Em análise": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    "Inativo": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
    "A ativar": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
    "Standby": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
  };
  
  // Definir as classes específicas para cada status de pedido
  const pedidoStatusClasses = {
    "Agendado": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    "Em Separação": "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
    "Despachado": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
    "Entregue": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
    "Cancelado": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
  };
  
  // Determinar qual conjunto de classes usar com base no status
  const statusClasses = 
    status in clienteStatusClasses 
      ? clienteStatusClasses[status as StatusCliente]
      : pedidoStatusClasses[status as StatusPedido];
  
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        sizeClasses[size],
        statusClasses,
        className
      )}
    >
      {status}
    </span>
  );
}
