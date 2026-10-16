import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Copy, Plus, X } from 'lucide-react';
import type { DiaSemana } from '@/types';
import {
  DIAS,
  MAX_FAIXAS,
  type Faixa,
  type HorariosRecebimento,
  resumoHorarios,
  validarHorarios,
} from '@/utils/horariosRecebimento';

/**
 * Horário de recebimento por dia, no estilo do Google Meu Negócio (Lucca, 15/10/2026).
 * Dia ligado sem faixa = recebe o dia todo. Regra e textos em utils/horariosRecebimento.ts.
 */
interface Props {
  value: HorariosRecebimento;
  onChange: (value: HorariosRecebimento) => void;
}

const FAIXA_PADRAO: Faixa = { de: '09:00', ate: '12:00' };

export default function HorariosRecebimentoPicker({ value, onChange }: Props) {
  const mudarDia = (dia: DiaSemana, faixas: Faixa[] | undefined) => {
    const novo = { ...value };
    if (faixas === undefined) delete novo[dia];
    else novo[dia] = faixas;
    onChange(novo);
  };

  const copiarParaTodos = (dia: DiaSemana) => {
    const faixas = value[dia] || [];
    const novo: HorariosRecebimento = { ...value };
    for (const d of DIAS) if (novo[d] !== undefined) novo[d] = faixas.map((f) => ({ ...f }));
    onChange(novo);
  };

  const erro = validarHorarios(value);
  const resumo = resumoHorarios(value);

  return (
    <div className="space-y-2">
      <div className="divide-y rounded-md border">
        {DIAS.map((dia) => {
          const faixas = value[dia];
          const recebe = faixas !== undefined;
          return (
            <div key={dia} className="flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2">
              <label className="flex w-24 shrink-0 items-center gap-2 pt-1.5 text-sm font-medium">
                <Switch checked={recebe} onCheckedChange={(v) => mudarDia(dia, v ? [] : undefined)} />
                {dia}
              </label>
              <div className="min-w-0 flex-1 space-y-1.5">
                {!recebe && <div className="pt-1.5 text-sm text-muted-foreground">Não recebe</div>}
                {recebe && faixas.length === 0 && (
                  <div className="pt-1.5 text-sm text-muted-foreground">O dia todo</div>
                )}
                {recebe &&
                  faixas.map((f, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Input
                        type="time"
                        value={f.de}
                        onChange={(e) => mudarDia(dia, faixas.map((x, j) => (j === i ? { ...x, de: e.target.value } : x)))}
                        className="h-8 w-[6.5rem]"
                        aria-label={`${dia}, das`}
                      />
                      <span className="text-xs text-muted-foreground">às</span>
                      <Input
                        type="time"
                        value={f.ate}
                        onChange={(e) => mudarDia(dia, faixas.map((x, j) => (j === i ? { ...x, ate: e.target.value } : x)))}
                        className="h-8 w-[6.5rem]"
                        aria-label={`${dia}, até`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => mudarDia(dia, faixas.filter((_, j) => j !== i))}
                        aria-label="Tirar faixa"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
              {recebe && (
                <div className="flex shrink-0 gap-1">
                  {faixas.length < MAX_FAIXAS && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={() =>
                        mudarDia(dia, [...faixas, faixas.length ? { de: '14:00', ate: '18:00' } : FAIXA_PADRAO])
                      }
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" /> faixa
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copiarParaTodos(dia)}
                    title="Copiar para os outros dias que recebem"
                    aria-label="Copiar para os outros dias"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {erro ? (
        <p className="text-xs text-destructive">{erro}</p>
      ) : (
        resumo && <p className="text-xs text-muted-foreground">{resumo}</p>
      )}
    </div>
  );
}
