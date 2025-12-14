import { Activity, Calendar, CalendarDays, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UsageMonitorProps {
  hoje: number;
  semana: number;
  mes: number;
  limiteHoje: number;
  loading?: boolean;
}

export function UsageMonitor({ hoje, semana, mes, limiteHoje, loading }: UsageMonitorProps) {
  const percentualUso = Math.min((hoje / limiteHoje) * 100, 100);
  
  const getStatus = () => {
    if (hoje >= limiteHoje) return { label: "Limite atingido", color: "text-destructive", icon: XCircle, bg: "bg-destructive/10" };
    if (hoje >= limiteHoje * 0.8) return { label: "Alto uso", color: "text-amber-600", icon: AlertTriangle, bg: "bg-amber-500/10" };
    return { label: "Normal", color: "text-emerald-600", icon: CheckCircle, bg: "bg-emerald-500/10" };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  if (loading) {
    return (
      <div className="flex items-center gap-6 p-3 bg-muted/50 rounded-lg border border-border/50 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-4 md:gap-6 p-3 bg-muted/30 rounded-lg border border-border/50">
      {/* Uso hoje com barra de progresso */}
      <div className="flex items-center gap-2 min-w-[140px]">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Hoje</span>
          <div className="flex items-center gap-2">
            <Progress value={percentualUso} className="h-1.5 w-16" />
            <span className="text-sm font-medium">{hoje}/{limiteHoje}</span>
          </div>
        </div>
      </div>

      {/* Semana */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Semana</span>
          <span className="text-sm font-medium">{semana}</span>
        </div>
      </div>

      {/* Mês */}
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Mês</span>
          <span className="text-sm font-medium">{mes}</span>
        </div>
      </div>

      {/* Status */}
      <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-md ml-auto", status.bg)}>
        <StatusIcon className={cn("h-3.5 w-3.5", status.color)} />
        <span className={cn("text-xs font-medium", status.color)}>{status.label}</span>
      </div>
    </div>
  );
}
