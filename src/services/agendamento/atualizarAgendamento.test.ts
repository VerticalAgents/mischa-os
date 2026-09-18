/**
 * A validação do agendamento é a parte que dá para testar sem banco — e é
 * justamente a que impede salvar um pedido com os sabores não batendo com o
 * total, que depois apareceria errado na produção e na expedição.
 */
import { describe, it, expect } from 'vitest';
import {
  validarAgendamento,
  ErroDeValidacaoDoAgendamento,
  type EntradaAtualizacaoAgendamento,
} from './atualizarAgendamento';

const base: EntradaAtualizacaoAgendamento = {
  clienteId: 'cliente-1',
  statusAgendamento: 'Previsto',
  dataProximaReposicao: new Date('2026-09-18T00:00:00'),
  tipoPedido: 'Padrão',
  quantidadeTotal: 50,
};

describe('validarAgendamento', () => {
  it('pedido padrão com data passa', () => {
    expect(() => validarAgendamento(base)).not.toThrow();
  });

  it('sem data não salva, a menos que o status seja Agendar', () => {
    expect(() => validarAgendamento({ ...base, dataProximaReposicao: null })).toThrow(
      ErroDeValidacaoDoAgendamento
    );

    expect(() =>
      validarAgendamento({ ...base, statusAgendamento: 'Agendar', dataProximaReposicao: null })
    ).not.toThrow();
  });

  it('pedido alterado exige a soma dos sabores igual ao total', () => {
    const itens = [
      { produto: 'Brownie Avelã', quantidade: 20 },
      { produto: 'Brownie Tradicional', quantidade: 30 },
    ];

    expect(() =>
      validarAgendamento({ ...base, tipoPedido: 'Alterado', itensPersonalizados: itens })
    ).not.toThrow();

    expect(() =>
      validarAgendamento({
        ...base,
        tipoPedido: 'Alterado',
        itensPersonalizados: [{ produto: 'Brownie Avelã', quantidade: 20 }],
      })
    ).toThrow(/20.*50/);
  });

  it('pedido alterado sem nenhum sabor não passa', () => {
    expect(() =>
      validarAgendamento({ ...base, tipoPedido: 'Alterado', itensPersonalizados: [] })
    ).toThrow(ErroDeValidacaoDoAgendamento);
  });

  it('no pedido padrão a soma dos sabores não importa', () => {
    expect(() =>
      validarAgendamento({
        ...base,
        tipoPedido: 'Padrão',
        itensPersonalizados: [{ produto: 'Brownie Avelã', quantidade: 3 }],
      })
    ).not.toThrow();
  });
});
