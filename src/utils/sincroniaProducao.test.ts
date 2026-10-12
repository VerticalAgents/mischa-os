// Espelho de mischas/tests/test_mischaos_sync.py: os mesmos casos, a mesma resposta.
import { describe, it, expect } from 'vitest';
import {
  compararProducao,
  novoLote,
  observacaoDoLote,
  type RegistroMischaOS,
  type SessaoUnno,
} from './sincroniaProducao';

const T = 'id-trad-odara';
const D = 'id-ddl-odara';
const MP = 'id-trad-mischas';
const HOJE = new Date(2026, 9, 12, 15, 0);

const produtos = () => [
  { id: T, nome: 'Brownie Tradicional Odara', rendimento: 60 },
  { id: D, nome: 'Brownie Doce de Leite Odara', rendimento: 60 },
  { id: MP, nome: 'Brownie Tradicional', rendimento: 60 },
];

const sessao = (cod: string, data: string, ficha: string, formas: number, status = 'fechada'): SessaoUnno => ({
  sessao: cod,
  data,
  status,
  ficha,
  formas,
});

const reg = (id: string, data: string, produto_id: string, produto_nome: string, formas: number): RegistroMischaOS => ({
  id,
  data,
  produto_id,
  produto_nome,
  formas,
});

const vazio = (p: ReturnType<typeof compararProducao>) =>
  !p.criar.length && !p.corrigir.length && !p.perguntar.length && !p.sobrando.length && !p.semProduto.length;

describe('compararProducao', () => {
  it('em dia nao tem pilha nenhuma', () => {
    const plano = compararProducao(
      [sessao('SESS-0044', '2026-09-28', 'Brownie Tradicional Odara', 48)],
      produtos(),
      [reg('r1', '2026-09-28', T, 'Brownie Tradicional Odara', 48)],
      HOJE
    );
    expect(vazio(plano)).toBe(true);
  });

  it('sessao sem registro falta lancar, cheia (formas x unidades por forma)', () => {
    const plano = compararProducao(
      [sessao('SESS-0045', '2026-09-29', 'Brownie Doce de Leite Odara', 48)],
      produtos(),
      [],
      HOJE
    );
    expect(plano.criar).toHaveLength(1);
    expect(plano.criar[0]).toMatchObject({ produto_id: D, formas: 48, unidades: 2880, sessoes: ['SESS-0045'] });
  });

  it('o caso de 24/09: corrige um e cria outro', () => {
    const plano = compararProducao(
      [
        sessao('SESS-0043', '2026-09-24', 'Brownie Tradicional Odara', 24),
        sessao('SESS-0043', '2026-09-24', 'Brownie Doce de Leite Odara', 24),
      ],
      produtos(),
      [reg('r24', '2026-09-24', T, 'Brownie Tradicional Odara', 48)],
      HOJE
    );
    expect(plano.corrigir.map(c => [c.id, c.de, c.formas])).toEqual([['r24', 48, 24]]);
    expect(plano.criar.map(c => [c.produto_id, c.formas])).toEqual([[D, 24]]);
    expect(plano.sobrando).toEqual([]);
    expect(plano.perguntar).toEqual([]);
  });

  it('dois registros no dia com soma errada vao para perguntar', () => {
    const plano = compararProducao(
      [sessao('SESS-0050', '2026-10-07', 'Brownie Tradicional Odara', 48)],
      produtos(),
      [
        reg('a', '2026-10-07', T, 'Brownie Tradicional Odara', 24),
        reg('b', '2026-10-07', T, 'Brownie Tradicional Odara', 12),
      ],
      HOJE
    );
    expect(plano.perguntar[0].noMischaOS).toEqual([24, 12]);
    expect(plano.criar).toEqual([]);
  });

  it('marca propria lancada a mao nao vira sobrando', () => {
    const plano = compararProducao(
      [sessao('SESS-0044', '2026-09-28', 'Brownie Tradicional Odara', 48)],
      produtos(),
      [
        reg('r1', '2026-09-28', T, 'Brownie Tradicional Odara', 48),
        reg('r2', '2026-10-09', MP, 'Brownie Tradicional', 8),
      ],
      HOJE
    );
    expect(vazio(plano)).toBe(true);
  });

  it('lancado adiantado aparece como sobrando, marcado como futuro', () => {
    const plano = compararProducao(
      [sessao('SESS-0044', '2026-09-28', 'Brownie Tradicional Odara', 48)],
      produtos(),
      [
        reg('r1', '2026-09-28', T, 'Brownie Tradicional Odara', 48),
        reg('fut', '2026-10-14', T, 'Brownie Tradicional Odara', 48),
      ],
      HOJE
    );
    expect(plano.sobrando.map(c => [c.id, c.futuro])).toEqual([['fut', true]]);
    expect(plano.criar).toEqual([]);
  });

  it('ficha sem produto de mesmo nome nao entra para lancar', () => {
    const plano = compararProducao(
      [
        sessao('SESS-0060', '2026-10-09', 'Brownie Zero Lactose Morena Cacau', 12),
        sessao('SESS-0045', '2026-09-29', 'Brownie Doce de Leite Odara', 48),
      ],
      produtos(),
      [],
      HOJE
    );
    expect(plano.semProduto.map(c => c.ficha)).toEqual(['Brownie Zero Lactose Morena Cacau']);
    expect(plano.criar.map(c => c.produto)).toEqual(['Brownie Doce de Leite Odara']);
  });

  it('sessao de hoje aberta e sessao planejada ficam de fora', () => {
    const plano = compararProducao(
      [
        sessao('SESS-0052', '2026-10-12', 'Brownie Tradicional Odara', 48, 'aberta'),
        sessao('SESS-0053', '2026-10-09', 'Brownie Tradicional Odara', 48, 'planejada'),
        sessao('SESS-0054', '2026-10-08', 'Brownie Tradicional Odara', 24, 'aberta'),
      ],
      produtos(),
      [],
      HOJE
    );
    expect(plano.criar.map(c => c.sessoes)).toEqual([['SESS-0054']]);
  });

  it('sessao cancelada nao e producao', () => {
    const plano = compararProducao(
      [
        sessao('SESS-0055', '2026-10-08', 'Brownie Tradicional Odara', 48, 'cancelada'),
        sessao('SESS-0056', '2026-10-08', 'Brownie Tradicional Odara', 24),
      ],
      produtos(),
      [],
      HOJE
    );
    expect(plano.criar.map(c => [c.formas, c.sessoes])).toEqual([[24, ['SESS-0056']]]);
  });

  it('nao olha antes de 14/09', () => {
    const plano = compararProducao(
      [sessao('SESS-0030', '2026-09-10', 'Brownie Tradicional Odara', 48)],
      produtos(),
      [],
      new Date(2026, 8, 20)
    );
    expect(vazio(plano)).toBe(true);
  });

  it('nome casa sem diferenca de maiuscula nem de espaco sobrando', () => {
    const plano = compararProducao(
      [sessao('SESS-0070', '2026-10-06', '  brownie   tradicional ODARA ', 12)],
      produtos(),
      [],
      HOJE
    );
    expect(plano.criar.map(c => c.produto_id)).toEqual([T]);
  });
});

describe('marca do lote', () => {
  it('usa o mesmo formato da skill, para o desfazer dela enxergar', () => {
    const lote = novoLote(new Date(2026, 9, 12, 10, 10, 10));
    expect(lote).toBe('20261012-101010');
    expect(observacaoDoLote(['SESS-0043', 'SESS-0044'], lote)).toBe(
      'SESS-0043, SESS-0044 (unno-estoque) [sync-20261012-101010]'
    );
  });
});
