import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationScore } from "@/types/confirmationScore";

interface ConfirmationScoreBadgeProps {
  score?: ConfirmationScore;
  loading?: boolean;
}

export default function ConfirmationScoreBadge({ score, loading }: ConfirmationScoreBadgeProps) {
  if (loading) {
    return (
      <Badge variant="outline" className="text-xs animate-pulse">
        ...
      </Badge>
    );
  }

  if (!score) return null;

  const getConfig = () => {
    if (score.score > 85) {
      return {
        label: "Confirmado Provável",
        className: "bg-green-500/15 text-green-700 border-green-300 hover:bg-green-500/25",
      };
    }
    if (score.score >= 50) {
      return {
        label: "Atenção",
        className: "bg-yellow-500/15 text-yellow-700 border-yellow-300 hover:bg-yellow-500/25",
      };
    }
    return {
      label: "Alto Risco",
      className: "bg-red-500/15 text-red-700 border-red-300 hover:bg-red-500/25",
    };
  };

  const config = getConfig();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs cursor-help ${config.className}`}>
            {score.score}% — {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1 text-xs">
            <p className="font-medium">{score.motivo}</p>
            <div className="text-muted-foreground space-y-0.5">
              <p>Base: {score.fatores.baseline}%</p>
              {score.fatores.penalidade_volatilidade !== 0 && (
                <p>Volatilidade: {score.fatores.penalidade_volatilidade}%</p>
              )}
              {score.fatores.vetor_tendencia !== 0 && (
                <p>Tendência: {score.fatores.vetor_tendencia > 0 ? '+' : ''}{score.fatores.vetor_tendencia}%</p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
