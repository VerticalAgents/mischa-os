import { addDays } from "date-fns";

export type PrazoPagamentoTipo = "dias" | "proximo_dia_semana";

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
  return `${Number(config.dias ?? 0)} dias`;
}