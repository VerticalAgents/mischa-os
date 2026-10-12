import { describe, it, expect } from 'vitest';
import { lerFormas, montarItens, totaisDoDia, unidadesDe, type LinhaDia } from './producaoDia';

const linha = (produtoId: string, formas: string, rendimento: number | null): LinhaDia => ({
  produtoId,
  formas,
  rendimento,
});

describe('lerFormas', () => {
  it('aceita so inteiro maior que zero', () => {
    expect(lerFormas('12')).toBe(12);
    expect(lerFormas(' 3 ')).toBe(3);
    expect(lerFormas('')).toBe(0);
    expect(lerFormas('0')).toBe(0);
    expect(lerFormas('-2')).toBe(0);
    expect(lerFormas('1,5')).toBe(0);
    expect(lerFormas('abc')).toBe(0);
  });
});

describe('unidadesDe', () => {
  it('arredonda para baixo, como o banco', () => {
    expect(unidadesDe(2, 60)).toBe(120);
    expect(unidadesDe(3, 1.35)).toBe(4);
  });
});

describe('montarItens', () => {
  const dia = new Date(2026, 9, 12, 23, 30);

  it('so leva as linhas preenchidas, com a data do dia escolhido', () => {
    const itens = montarItens(dia, [
      linha('a', '12', 60),
      linha('b', '', 60),
      linha('c', '4', 2),
    ]);
    expect(itens).toEqual([
      { data: '2026-10-12', produto_id: 'a', formas: 12 },
      { data: '2026-10-12', produto_id: 'c', formas: 4 },
    ]);
  });

  it('produto sem rendimento nao entra, mesmo com formas digitadas', () => {
    expect(montarItens(dia, [linha('a', '5', null), linha('b', '5', 0)])).toEqual([]);
  });
});

describe('totaisDoDia', () => {
  it('soma so o que vai ser lancado', () => {
    expect(
      totaisDoDia([linha('a', '12', 60), linha('b', '', 60), linha('c', '4', 2), linha('d', '9', null)])
    ).toEqual({ produtos: 2, formas: 16, unidades: 728 });
  });
});
