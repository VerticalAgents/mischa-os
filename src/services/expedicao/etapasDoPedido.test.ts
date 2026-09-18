/**
 * Quais botões aparecem em cada etapa. É a regra que impede despachar o que não
 * foi separado e confirmar entrega do que não saiu — e, principalmente,
 * confirmar a mesma entrega duas vezes, que dá baixa dobrada no estoque.
 */
import { describe, it, expect } from 'vitest';
import { acoesPossiveis, type PedidoNaExpedicao } from './etapasDoPedido';

const pedido = (p: Partial<PedidoNaExpedicao>): PedidoNaExpedicao => ({
  id: 'ag-1',
  cliente_id: 'cliente-1',
  status_agendamento: 'Agendado',
  substatus_pedido: 'Agendado',
  quantidade_total: 50,
  data_proxima_reposicao: '2026-09-18',
  confirmado_em: null,
  separado_em: null,
  despachado_em: null,
  gestaoclick_venda_id: null,
  ...p,
});

describe('acoesPossiveis', () => {
  it('pedido confirmado e ainda não separado: só separar', () => {
    const a = acoesPossiveis(pedido({ substatus_pedido: 'Agendado' }));
    expect(a).toEqual({
      podeSeparar: true,
      podeDesfazerSeparacao: false,
      podeDespachar: false,
      podeDesfazerDespacho: false,
      podeConfirmarEntrega: false,
    });
  });

  it('pedido só previsto não vai para separação', () => {
    // Separar antes de o cliente confirmar reserva estoque de um pedido que
    // pode nem acontecer.
    const a = acoesPossiveis(pedido({ status_agendamento: 'Previsto' }));
    expect(a.podeSeparar).toBe(false);
  });

  it('separado: despachar ou voltar atrás', () => {
    const a = acoesPossiveis(pedido({ substatus_pedido: 'Separado' }));
    expect(a.podeDespachar).toBe(true);
    expect(a.podeDesfazerSeparacao).toBe(true);
    expect(a.podeConfirmarEntrega).toBe(false);
  });

  it('despachado: confirmar entrega ou desfazer o despacho', () => {
    const a = acoesPossiveis(pedido({ substatus_pedido: 'Despachado' }));
    expect(a.podeConfirmarEntrega).toBe(true);
    expect(a.podeDesfazerDespacho).toBe(true);
    expect(a.podeSeparar).toBe(false);
    expect(a.podeDespachar).toBe(false);
  });

  it('depois da entrega o pedido volta para o começo do ciclo', () => {
    // É o estado em que process_entrega_safe deixa a linha: Previsto e
    // Agendado, com data nova. Nada de confirmar entrega de novo.
    const a = acoesPossiveis(
      pedido({ status_agendamento: 'Previsto', substatus_pedido: 'Agendado' })
    );
    expect(a.podeConfirmarEntrega).toBe(false);
    expect(a.podeSeparar).toBe(false);
  });

  it('cliente sem pedido nenhum não tem ação', () => {
    const a = acoesPossiveis(null);
    expect(Object.values(a).every((v) => v === false)).toBe(true);
  });
});
