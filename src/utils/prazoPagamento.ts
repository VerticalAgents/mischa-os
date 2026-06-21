import { addDays } from "date-fns";

export type PrazoPagamentoTipo =
  | "dias"
  | "proximo_dia_semana"
  | "ultimo_dia_util_mes";

export interface PrazoPagamentoConfig {
  tipo?: PrazoPagamentoTipo | null;
  dias?: number | null;
  diaSemana?: number | null;       // 0=Dom .. 6=Sab
  diasMinimos?: number | null;
}

const DIAS_SEMANA_LABEL = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function diaSemanaLabel(dow: number | null | undefined): string {
  if (dow == null || dow < 0 || dow > 6) return "-";
  return DIAS_SEMANA_LABEL[dow];
}

/**
 * Calcula a data de vencimento a partir de uma data base e config de prazo.
 */
export function calcularVencimentoPrazo(
  base: Date,
  config: PrazoPagamentoConfig
): Date {
  const tipo = config.tipo || "dias";
  if (tipo === "proximo_dia_semana") {
    const minimos = Math.max(0, Number(config.diasMinimos ?? 0));
    const alvo = Math.min(6, Math.max(0, Number(config.diaSemana ?? 1)));
    let d = addDays(base, minimos);
    // avança até cair no dia da semana alvo
    let guard = 0;
    while (d.getDay() !== alvo && guard < 8) {
      d = addDays(d, 1);
      guard++;
    }
    return d;
  }
  if (tipo === "ultimo_dia_util_mes") {
    // último dia útil (seg–sex) do mês da data base
    let d = new Date(base.getFullYear(), base.getMonth() + 1, 0);
    // se cair em sábado (6) recua 1 dia, se domingo (0) recua 2
    while (d.getDay() === 0 || d.getDay() === 6) {
      d = addDays(d, -1);
    }
    return d;
  }
  const dias = Math.max(0, Number(config.dias ?? 0));
  return addDays(base, dias);
}

/**
 * Texto curto descrevendo o prazo (usado em PDFs / UI).
 */
export function descreverPrazo(config: PrazoPagamentoConfig): string {
  const tipo = config.tipo || "dias";
  if (tipo === "proximo_dia_semana") {
    const min = Number(config.diasMinimos ?? 0);
    return `próxima ${diaSemanaLabel(config.diaSemana ?? 1)} (mín. ${min} dias)`;
  }
  if (tipo === "ultimo_dia_util_mes") {
    return `último dia útil do mês`;
  }
  return `${Number(config.dias ?? 0)} dias`;
}