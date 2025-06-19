
import { Badge } from "@/components/ui/badge";

interface TipoPedidoBadgeProps {
  tipo: string;
}

export default function TipoPedidoBadge({ tipo }: TipoPedidoBadgeProps) {
  const isAlterado = tipo === "Alterado";
  
  return (
    <Badge 
      variant={isAlterado ? "destructive" : "secondary"}
      className={isAlterado 
        ? "bg-red-100 text-red-800 border border-red-200" 
        : "bg-green-100 text-green-800 border border-green-200"
      }
    >
      {tipo}
    </Badge>
  );
}
