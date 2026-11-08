import { describe, it, expect } from 'vitest';
import {
  VENDA_DIRETA_ID,
  VENDA_DIRETA_ROTULO,
  casaComFiltroRepresentante,
  casaComNomeRepresentante,
  casaComValorRepresentante,
  nomeDoRepresentante,
  representantesParaEscolher,
} from './vendaDireta';

describe('casaComFiltroRepresentante', () => {
  it('filtro vazio mostra todos', () => {
    expect(casaComFiltroRepresentante([], null)).toBe(true);
    expect(casaComFiltroRepresentante([], 14)).toBe(true);
  });

  it('só venda direta acha quem não tem representante, e só ele', () => {
    expect(casaComFiltroRepresentante([VENDA_DIRETA_ID], null)).toBe(true);
    expect(casaComFiltroRepresentante([VENDA_DIRETA_ID], undefined)).toBe(true);
    expect(casaComFiltroRepresentante([VENDA_DIRETA_ID], 14)).toBe(false);
  });

  it('venda direta junto com um representante acha os dois', () => {
    expect(casaComFiltroRepresentante([VENDA_DIRETA_ID, 14], null)).toBe(true);
    expect(casaComFiltroRepresentante([VENDA_DIRETA_ID, 14], 14)).toBe(true);
    expect(casaComFiltroRepresentante([VENDA_DIRETA_ID, 14], 19)).toBe(false);
  });

  it('representante sem venda direta deixa o cliente direto de fora', () => {
    expect(casaComFiltroRepresentante([14], null)).toBe(false);
    expect(casaComFiltroRepresentante([14], 14)).toBe(true);
  });
});

describe('casaComValorRepresentante', () => {
  it('trata todos, venda direta e representante', () => {
    expect(casaComValorRepresentante('todos', null)).toBe(true);
    expect(casaComValorRepresentante(String(VENDA_DIRETA_ID), null)).toBe(true);
    expect(casaComValorRepresentante(String(VENDA_DIRETA_ID), 14)).toBe(false);
    expect(casaComValorRepresentante('14', 14)).toBe(true);
    expect(casaComValorRepresentante('14', null)).toBe(false);
  });
});

describe('casaComNomeRepresentante', () => {
  it('compara por nome, e venda direta casa com nome vazio', () => {
    expect(casaComNomeRepresentante(undefined, 'Tiago')).toBe(true);
    expect(casaComNomeRepresentante(VENDA_DIRETA_ROTULO, null)).toBe(true);
    expect(casaComNomeRepresentante(VENDA_DIRETA_ROTULO, 'Tiago')).toBe(false);
    expect(casaComNomeRepresentante('Tiago', 'Tiago')).toBe(true);
    expect(casaComNomeRepresentante('Tiago', null)).toBe(false);
  });
});

describe('nomeDoRepresentante', () => {
  const lista = [{ id: 14, nome: 'Ítalo' }];
  it('sem representante é venda direta', () => {
    expect(nomeDoRepresentante(null, lista)).toBe(VENDA_DIRETA_ROTULO);
  });
  it('acha o nome, e id desconhecido não vira venda direta', () => {
    expect(nomeDoRepresentante(14, lista)).toBe('Ítalo');
    expect(nomeDoRepresentante(99, lista)).toBe('Rep #99');
  });
});

describe('representantesParaEscolher', () => {
  const lista = [{ id: 4, ativo: false }, { id: 14, ativo: true }];
  it('esconde inativo', () => {
    expect(representantesParaEscolher(lista).map((r) => r.id)).toEqual([14]);
  });
  it('mantém o inativo que já é o atual do cliente', () => {
    expect(representantesParaEscolher(lista, 4).map((r) => r.id)).toEqual([4, 14]);
  });
});
