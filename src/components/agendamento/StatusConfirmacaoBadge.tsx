
import { Badge } from "@/components/ui/badge";

interface StatusConfirmacaoBadgeProps {
  status: string;
}

export default function StatusConfirmacaoBadge({ status }: StatusConfirmacaoBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmado':
        return {
          label: 'Confirmado',
          variant: 'default' as const,
          className: 'bg-green-500 text-white hover:bg-green-600'
        };
      case 'aguardando_retorno':
        return {
          label: 'Aguardando Retorno',
          variant: 'secondary' as const,
          className: 'bg-orange-500 text-white hover:bg-orange-600'
        };
      case 'reenviado':
        return {
          label: 'Reenviado',
          variant: 'outline' as const,
          className: 'bg-blue-500 text-white hover:bg-blue-600'
        };
      case 'nao_respondeu':
        return {
          label: 'Não Respondeu',
          variant: 'destructive' as const,
          className: 'bg-red-500 text-white hover:bg-red-600'
        };
      default:
        return {
          label: 'Desconhecido',
          variant: 'outline' as const,
          className: ''
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
