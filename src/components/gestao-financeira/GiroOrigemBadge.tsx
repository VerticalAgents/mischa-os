import { Badge } from "@/components/ui/badge";

interface GiroOrigemBadgeProps {
  origem?: 'personalizado' | 'historico_completo' | 'historico_parcial' | 'projetado';
  numeroSemanas?: number;
  compact?: boolean;
}

export default function GiroOrigemBadge({ origem, numeroSemanas = 0, compact = false }: GiroOrigemBadgeProps) {
  if (!origem) return null;

  const configs = {
    personalizado: {
      icon: '⭐',
      label: compact ? 'Pers.' : 'Personalizado',
      className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-700',
    },
    historico_completo: {
      icon: '🟢',
      label: compact ? '12 sem' : `Real (${numeroSemanas} sem)`,
      className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
    },
    historico_parcial: {
      icon: '🟡',
      label: compact ? `${numeroSemanas}sem` : `Parcial (${numeroSemanas} sem)`,
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
    },
    projetado: {
      icon: '🔵',
      label: compact ? 'Proj.' : 'Projetado',
      className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
    },
  };

  const config = configs[origem];

  return (
    <Badge 
      variant="secondary" 
      className={`${config.className} text-xs font-normal`}
      title={`Origem do giro: ${config.label}`}
    >
      {config.icon} {config.label}
    </Badge>
  );
}
