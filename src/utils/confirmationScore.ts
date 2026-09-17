/**
 * Score de confirmação: a chance de o cliente confirmar a reposição agendada.
 *
 * A fórmula morava dentro do hook `useConfirmationScore`, que calcula para uma
 * LISTA de agendamentos. A extensão do WhatsApp precisa do mesmo número para UM
 * cliente só, então o miolo virou esta função pura — sem React, sem Supabase,
 * sem relógio próprio (a data de hoje não entra aqui; o que entra é a data
 * agendada e o histórico já filtrado).
 *
 * Nada da conta mudou na extração: ver `confirmationScore.test.ts`, cujos casos
 * foram tirados do comportamento anterior.
 */

import { differenceInDays } from "date-fns";
import { ConfirmationScore } from "@/types/confirmationScore";

export interface EntregaParaScore {
  /** `yyyy-mm-dd` ou ISO. Só entregas (`tipo = 'entrega'`), últimos 84 dias. */
  data: string;
}

export interface ReagendamentoParaScore {
  data_original: string;
  /** `adiamento` ou `adiantamento`. */
  tipo: string;
  created_at: string;
  agendamento_id: string | null;
}

export interface EntradaConfirmationScore {
  entregas: EntregaParaScore[];
  reagendamentos: ReagendamentoParaScore[];
  dataAgendada: Date;
  agendamentoId?: string;
  /** Usada só no caso de uma entrega só, para explicar a cadência estimada. */
  periodicidadePadrao?: number;
}

/** Acima de 85 é alto; de 50 a 85, médio; abaixo disso, baixo. */
const nivelDoScore = (score: number): ConfirmationScore['nivel'] =>
  score > 85 ? 'alto' : score >= 50 ? 'medio' : 'baixo';

export function calcularConfirmationScore({
  entregas,
  reagendamentos,
  dataAgendada,
  agendamentoId,
  periodicidadePadrao,
}: EntradaConfirmationScore): ConfirmationScore {
  // COLD START — sem histórico não se inventa nota.
  if (entregas.length === 0) {
    return {
      score: 70,
      nivel: 'medio',
      motivo: 'Cliente novo, sem histórico de entregas',
      fatores: { baseline: 70, penalidade_volatilidade: 0, vetor_tendencia: 0 },
    };
  }

  if (entregas.length === 1) {
    const periodicidade = periodicidadePadrao || 14;
    return {
      score: 80,
      nivel: 'medio',
      motivo: `Apenas 1 entrega registrada; cadência estimada de ${periodicidade} dias`,
      fatores: { baseline: 80, penalidade_volatilidade: 0, vetor_tendencia: 0 },
    };
  }

  // Intervalo médio entre entregas — a cadência do cliente.
  const datas = entregas
    .map((e) => new Date(e.data))
    .sort((a, b) => a.getTime() - b.getTime());

  let totalIntervalos = 0;
  for (let i = 1; i < datas.length; i++) {
    totalIntervalos += differenceInDays(datas[i], datas[i - 1]);
  }
  const intervaloMedio = totalIntervalos / (datas.length - 1);

  // BASELINE: o quanto a data agendada foge da cadência.
  const ultimaEntrega = datas[datas.length - 1];
  const dataEsperada = new Date(ultimaEntrega);
  dataEsperada.setDate(dataEsperada.getDate() + Math.round(intervaloMedio));

  const desvio = differenceInDays(dataAgendada, dataEsperada);
  const peso = entregas.length === 2 ? 0.5 : 1;

  let penalidade = 0;
  if (desvio >= -3) {
    // Em dia ou atrasado: o cliente precisa do produto — até 10 pontos de bônus.
    if (desvio > 0) penalidade = -Math.min(desvio, 10) * 1;
  } else {
    // Adiantamento grande: provavelmente ainda tem estoque.
    penalidade = Math.abs(desvio + 3) * 2;
  }
  const baseline = Math.min(99, 95 - penalidade * peso);

  // VOLATILIDADE: reagendamentos deste pedido.
  let reagendamentosVinculados = agendamentoId
    ? reagendamentos.filter((r) => r.agendamento_id === agendamentoId)
    : [];

  // Sem vínculo direto, vale o que está a até 7 dias da data agendada.
  if (reagendamentosVinculados.length === 0) {
    reagendamentosVinculados = reagendamentos.filter(
      (r) => Math.abs(differenceInDays(new Date(r.data_original), dataAgendada)) <= 7
    );
  }

  let penalidade_volatilidade =
    reagendamentosVinculados.length === 0 ? 0 : reagendamentosVinculados.length * -15;

  // Remarcar em cima da hora pesa mais.
  for (const r of reagendamentosVinculados) {
    const horasAntecedencia =
      (new Date(r.data_original).getTime() - new Date(r.created_at).getTime()) / 3_600_000;
    if (horasAntecedencia < 24) penalidade_volatilidade -= 10;
  }

  // VETOR DE TENDÊNCIA: para onde o cliente costuma puxar a data.
  let vetor_tendencia = 0;
  if (reagendamentos.length > 0) {
    const adiantamentos = reagendamentos.filter((r) => r.tipo === 'adiantamento').length;
    const adiamentos = reagendamentos.filter((r) => r.tipo === 'adiamento').length;

    if (adiantamentos > adiamentos) vetor_tendencia = 5;

    const adiamentosVinculados = reagendamentosVinculados.filter(
      (r) => r.tipo === 'adiamento'
    ).length;
    if (adiamentosVinculados >= 2) vetor_tendencia -= 20;
  }

  const score = Math.min(99, Math.max(5, Math.round(baseline + penalidade_volatilidade + vetor_tendencia)));

  const motivos: string[] = [`Cadência de ${Math.round(intervaloMedio)} dias`];
  if (reagendamentosVinculados.length > 0) {
    motivos.push(`${reagendamentosVinculados.length} reagendamento(s)`);
  }
  if (desvio > 0) {
    motivos.push(`${desvio} dia(s) além da cadência — alta necessidade`);
  } else if (desvio < -3) {
    motivos.push(`${Math.abs(desvio)} dia(s) antes da cadência — baixa necessidade`);
  }

  return {
    score,
    nivel: nivelDoScore(score),
    motivo: motivos.join('; '),
    fatores: {
      baseline: Math.round(baseline),
      penalidade_volatilidade,
      vetor_tendencia,
    },
  };
}
