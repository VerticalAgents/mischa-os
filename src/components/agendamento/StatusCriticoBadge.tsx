
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCriticoBadgeProps {
  status: string;
  dataReposicao: Date;
  className?: string;
}

export default function StatusCriticoBadge({ 
  status, 
  dataReposicao, 
  className 
}: StatusCriticoBadgeProps) {
  const isToday = new Date().toDateString() === dataReposicao.toDateString();
  
  const isCritico = isToday && [
    "Previsto",
    "Contatado, sem resposta", 
    "Reenviar após 24h"
  ].includes(status);

  const isVerificacaoPresencial = status === "Verificação presencial";

  if (!isCritico && !isVerificacaoPresencial) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className={cn("flex items-center gap-1 animate-pulse", className)}
    >
      <AlertTriangle className="h-3 w-3" />
      {isVerificacaoPresencial ? "CRÍTICO" : "URGENTE"}
    </Badge>
  );
}
