
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GiroTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: any;
    name?: string;
    dataKey?: string;
    color?: string;
    payload?: any;
  }>;
  label?: any;
}

export default function GiroTooltip({ active, payload, label }: GiroTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const data = payload[0].payload;
  const entregas = data.entregas || [];
  const giroSemanal = data.valor || 0;
  const mediaGeral = data.mediaGeral || 0;

  return (
    <div className="bg-background border border-border rounded-md shadow-lg p-4 min-w-[200px]">
      <div className="font-semibold mb-2">{label}</div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Giro Semanal:</span>
          <span className="font-medium">{giroSemanal} unidades</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Média Geral:</span>
          <span className="font-medium">{mediaGeral} unidades</span>
        </div>
      </div>

      {entregas.length > 0 && (
        <div>
          <div className="text-sm font-medium mb-2">Entregas da semana:</div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {entregas.map((entrega: any, index: number) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-muted-foreground">
                  {format(new Date(entrega.data), 'dd/MM', { locale: ptBR })}
                </span>
                <span>{entrega.quantidade} un</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {entregas.length === 0 && giroSemanal === 0 && (
        <div className="text-xs text-muted-foreground">
          Nenhuma entrega nesta semana
        </div>
      )}
    </div>
  );
}
