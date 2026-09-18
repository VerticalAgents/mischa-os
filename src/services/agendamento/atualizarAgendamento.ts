/**
 * Salvar um agendamento, com todos os efeitos que isso tem.
 *
 * A regra morava dentro da tela de edição (`AgendamentoEditModal.handleSalvar`),
 * misturada com toast e fechamento de modal. A extensão do WhatsApp precisa
 * salvar o mesmo agendamento de fora do app, e copiar a regra significaria duas
 * versões dela — que uma hora divergem, e aí o mesmo botão passa a fazer coisas
 * diferentes dependendo de onde foi apertado.
 *
 * O que esta função faz, na mesma ordem da tela:
 *   1. valida (soma dos sabores igual ao total; data obrigatória fora de "Agendar")
 *   2. registra o pulo de semana em `reagendamentos_entre_semanas` — é dali que
 *      sai o score de confirmação
 *   3. grava tudo num único update, incluindo zerar `gestaoclick_nf_id`, que é
 *      o que libera gerar a nota de novo
 *
 * O que ela **não** faz, de propósito: toast, recarregar listas, mexer na venda
 * do Gestão Click. Isso é decisão de quem chamou.
 */
import { supabase } from '@/integrations/supabase/client';
import { registrarReagendamentoEntreSemanas } from '@/utils/reagendamentoUtils';
import { formatDateForDatabase } from '@/hooks/agendamento/utils';

export type StatusAgendamento = 'Agendar' | 'Previsto' | 'Agendado';
export type TipoPedido = 'Padrão' | 'Alterado';

export interface ItemPersonalizado {
  /** O NOME do produto (produtos_finais.nome), não o id. */
  produto: string;
  /** Sempre em unidades. */
  quantidade: number;
}

export interface EntradaAtualizacaoAgendamento {
  clienteId: string;
  statusAgendamento: StatusAgendamento;
  dataProximaReposicao: Date | null;
  tipoPedido: TipoPedido;
  quantidadeTotal: number;
  itensPersonalizados?: ItemPersonalizado[] | null;
  observacoesAgendamento?: string | null;
  trocasPendentes?: unknown[];
  bonificacoesPendentes?: unknown[];
  /**
   * Editar um pedido libera gerar a nota de novo, porque o conteúdo mudou.
   * Confirmar e adiar não mudam o pedido, só o quando e o status — por isso
   * essas duas passam `true` aqui e a nota já emitida continua valendo.
   */
  manterNotaFiscal?: boolean;
}

export interface ResultadoAtualizacaoAgendamento {
  /** Verdadeiro quando a data pulou de semana e o reagendamento foi registrado. */
  reagendamentoRegistrado: boolean;
  /** A venda do Gestão Click ficou desatualizada; null quando não havia venda. */
  vendaGcPendente: string | null;
  dataAnterior: string | null;
}

export class ErroDeValidacaoDoAgendamento extends Error {}

/** As mesmas travas da tela, como erro tipado em vez de toast. */
export function validarAgendamento(entrada: EntradaAtualizacaoAgendamento): void {
  const { statusAgendamento, dataProximaReposicao, tipoPedido, quantidadeTotal } = entrada;

  if (statusAgendamento !== 'Agendar' && !dataProximaReposicao) {
    throw new ErroDeValidacaoDoAgendamento('Escolha a data da reposição.');
  }

  if (tipoPedido === 'Alterado') {
    const itens = entrada.itensPersonalizados || [];
    const soma = itens.reduce((s, i) => s + (Number(i.quantidade) || 0), 0);

    if (soma !== quantidadeTotal) {
      throw new ErroDeValidacaoDoAgendamento(
        `A soma dos sabores (${soma}) tem que bater com o total do pedido (${quantidadeTotal}).`
      );
    }
  }
}

export async function atualizarAgendamento(
  entrada: EntradaAtualizacaoAgendamento
): Promise<ResultadoAtualizacaoAgendamento> {
  validarAgendamento(entrada);

  const {
    clienteId,
    statusAgendamento,
    tipoPedido,
    quantidadeTotal,
    observacoesAgendamento,
    trocasPendentes,
    bonificacoesPendentes,
  } = entrada;

  // Sem data quando o status é "Agendar": é justamente o estado de "ainda vou
  // marcar". Gravar a data de hoje aqui inventaria um compromisso.
  const dataNova = statusAgendamento === 'Agendar' ? null : entrada.dataProximaReposicao;

  const { data: atual } = await supabase
    .from('agendamentos_clientes')
    .select('id, data_proxima_reposicao, gestaoclick_venda_id')
    .eq('cliente_id', clienteId)
    .maybeSingle();

  const dataAnterior = atual?.data_proxima_reposicao ?? null;

  let reagendamentoRegistrado = false;
  if (dataNova && dataAnterior) {
    const anterior = new Date(`${dataAnterior}T00:00:00`);
    if (anterior.getTime() !== dataNova.getTime()) {
      // A própria função não faz nada quando é a mesma semana.
      await registrarReagendamentoEntreSemanas(clienteId, anterior, dataNova, atual?.id);
      reagendamentoRegistrado = true;
    }
  }

  const campos = {
    status_agendamento: statusAgendamento,
    // Nunca `toISOString()`: ele converte para Londres e rouba um dia.
    data_proxima_reposicao: dataNova ? formatDateForDatabase(dataNova) : null,
    tipo_pedido: tipoPedido,
    quantidade_total: quantidadeTotal,
    itens_personalizados:
      tipoPedido === 'Alterado'
        ? (JSON.parse(JSON.stringify(entrada.itensPersonalizados || [])) as never)
        : null,
    // Editar libera gerar a nota de novo.
    ...(entrada.manterNotaFiscal ? {} : { gestaoclick_nf_id: null }),
    updated_at: new Date().toISOString(),
    ...(observacoesAgendamento !== undefined
      ? { observacoes_agendamento: observacoesAgendamento || null }
      : {}),
    // Lista vazia, nunca nulo: é o que o resto do app espera encontrar.
    ...(trocasPendentes !== undefined
      ? { trocas_pendentes: JSON.parse(JSON.stringify(trocasPendentes)) as never }
      : {}),
    ...(bonificacoesPendentes !== undefined
      ? { bonificacoes_pendentes: JSON.parse(JSON.stringify(bonificacoesPendentes)) as never }
      : {}),
  };

  if (atual) {
    const { error } = await supabase
      .from('agendamentos_clientes')
      .update(campos)
      .eq('cliente_id', clienteId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('agendamentos_clientes')
      .insert({ cliente_id: clienteId, created_at: new Date().toISOString(), ...campos });
    if (error) throw error;
  }

  return {
    reagendamentoRegistrado,
    vendaGcPendente: atual?.gestaoclick_venda_id ?? null,
    dataAnterior,
  };
}
