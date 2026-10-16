import { describe, it, expect } from 'vitest';
import {
  SORTIDO,
  UNIDADES_POR_DISPLAY,
  composicaoOuPadrao,
  validarComposicao,
  atrasoBloqueiaPedido,
  prazoDoBoleto,
  dataEntrega,
  expandirParaItens,
  precoPorDisplays,
  precoUnitarioDisplays,
  totalDisplays,
  totalUnidades,
  validarPedido,
} from './pedidoDisplays';

/** Um instante no horário de São Paulo (UTC-3, sem horário de verão). */
const sp = (data: string, hora: string) => new Date(`${data}T${hora}:00-03:00`);

describe('display sortido', () => {
  it('soma 18', () => {
    expect(Object.values(SORTIDO).reduce((s, n) => s + n, 0)).toBe(UNIDADES_POR_DISPLAY);
  });

  it('abre 2 sortidos + 1 de Avelã em brownies por sabor', () => {
    const pedido = { sortido: 2, sabores: { 'Brownie Avelã': 1 } };
    expect(totalDisplays(pedido)).toBe(3);
    expect(totalUnidades(pedido)).toBe(54);
    expect(expandirParaItens(pedido)).toEqual([
      { produto: 'Brownie Avelã', quantidade: 28 },
      { produto: 'Brownie Stikadinho', quantidade: 8 },
      { produto: 'Brownie Choco Duo', quantidade: 10 },
      { produto: 'Brownie Tradicional', quantidade: 6 },
      { produto: 'Brownie Meio Amargo', quantidade: 2 },
    ]);
  });

  it('usa a composição salva no lugar do padrão', () => {
    const composicao = {
      'Brownie Avelã': 6, 'Brownie Stikadinho': 6, 'Brownie Choco Duo': 6,
      'Brownie Tradicional': 0, 'Brownie Meio Amargo': 0,
    };
    expect(expandirParaItens({ sortido: 2, sabores: {} }, composicao)).toEqual([
      { produto: 'Brownie Avelã', quantidade: 12 },
      { produto: 'Brownie Stikadinho', quantidade: 12 },
      { produto: 'Brownie Choco Duo', quantidade: 12 },
    ]);
  });

  it('composição que não soma 18 cai no padrão', () => {
    const torta = { 'Brownie Avelã': 10, 'Brownie Stikadinho': 10 };
    expect(validarComposicao(torta).ok).toBe(false);
    expect(composicaoOuPadrao(torta)).toBe(SORTIDO);
    expect(validarComposicao({ ...SORTIDO, 'Mini Brownie Tradicional': 0 }).ok).toBe(false);
    expect(validarComposicao({ ...SORTIDO, 'Brownie Avelã': 4.5, 'Brownie Meio Amargo': 1.5 }).ok).toBe(false);
    expect(validarComposicao(SORTIDO).ok).toBe(true);
  });

  it('display de um sabor só não cria linha dos outros sabores', () => {
    expect(expandirParaItens({ sortido: 0, sabores: { 'Brownie Tradicional': 2 } })).toEqual([
      { produto: 'Brownie Tradicional', quantidade: 36 },
    ]);
  });
});

describe('validação', () => {
  it('barra menos de 2 displays', () => {
    expect(validarPedido({ sortido: 1, sabores: {} }).ok).toBe(false);
    expect(validarPedido({ sortido: 0, sabores: {} }).ok).toBe(false);
  });

  it('aceita 2 displays, de qualquer combinação', () => {
    expect(validarPedido({ sortido: 2, sabores: {} }).ok).toBe(true);
    expect(validarPedido({ sortido: 1, sabores: { 'Brownie Avelã': 1 } }).ok).toBe(true);
  });

  it('barra sabor que não é do canal', () => {
    expect(validarPedido({ sortido: 2, sabores: { 'Mini Brownie Tradicional': 1 } }).ok).toBe(false);
  });
});

describe('preço por faixa', () => {
  it('muda nos limites certos', () => {
    expect([2, 3, 4, 5, 6, 7, 8, 20].map(precoPorDisplays)).toEqual([
      4.95, 4.95, 4.85, 4.85, 4.8, 4.8, 4.75, 4.75,
    ]);
  });

  it('não mexe no preço de cliente que não é de displays', () => {
    expect(
      precoUnitarioDisplays({ modeloPedido: 'padrao', categoriaId: 1, unidadesDaCategoria: 72, precoAtual: 4.5 }),
    ).toBe(4.5);
    expect(
      precoUnitarioDisplays({ modeloPedido: null, categoriaId: 1, unidadesDaCategoria: 72, precoAtual: 4.5 }),
    ).toBe(4.5);
  });

  it('não mexe no preço de outra categoria', () => {
    expect(
      precoUnitarioDisplays({ modeloPedido: 'displays', categoriaId: 2, unidadesDaCategoria: 72, precoAtual: 28 }),
    ).toBe(28);
  });

  it('cliente de displays paga pela faixa da entrega', () => {
    const preco = (unidades: number) =>
      precoUnitarioDisplays({ modeloPedido: 'displays', categoriaId: 1, unidadesDaCategoria: unidades, precoAtual: 4.8 });
    expect(preco(54)).toBe(4.95);
    expect(preco(72)).toBe(4.85);
    expect(preco(144)).toBe(4.75);
  });
});

describe('dia de entrega', () => {
  it('de sexta até terça às 14h entra na quarta', () => {
    expect(dataEntrega(sp('2026-10-09', '08:00'))).toBe('2026-10-14'); // sexta
    expect(dataEntrega(sp('2026-10-10', '15:00'))).toBe('2026-10-14'); // sábado
    expect(dataEntrega(sp('2026-10-11', '20:00'))).toBe('2026-10-14'); // domingo
    expect(dataEntrega(sp('2026-10-12', '18:00'))).toBe('2026-10-14'); // segunda
    expect(dataEntrega(sp('2026-10-13', '13:59'))).toBe('2026-10-14'); // terça
  });

  it('de terça depois das 14h até quinta às 14h entra na sexta', () => {
    expect(dataEntrega(sp('2026-10-13', '14:01'))).toBe('2026-10-16'); // terça
    expect(dataEntrega(sp('2026-10-14', '09:00'))).toBe('2026-10-16'); // quarta
    expect(dataEntrega(sp('2026-10-14', '19:00'))).toBe('2026-10-16'); // quarta
    expect(dataEntrega(sp('2026-10-15', '13:59'))).toBe('2026-10-16'); // quinta
  });

  it('quinta depois das 14h e sexta vão para a quarta seguinte', () => {
    expect(dataEntrega(sp('2026-10-15', '14:01'))).toBe('2026-10-21');
    expect(dataEntrega(sp('2026-10-16', '10:00'))).toBe('2026-10-21');
  });

  it('usa o dia de São Paulo, não o de Londres', () => {
    // Terça 23h30 em São Paulo já é quarta em UTC: tem que contar como terça à noite.
    expect(dataEntrega(new Date('2026-10-14T02:30:00Z'))).toBe('2026-10-16');
    // Segunda 23h30 em São Paulo (terça em UTC): passou das 14h de segunda, entra na quarta.
    expect(dataEntrega(new Date('2026-10-13T02:30:00Z'))).toBe('2026-10-14');
  });
});

describe('prazo do boleto', () => {
  it('7 dias enquanto o cliente não tem 3 pedidos entregues e pagos', () => {
    expect(prazoDoBoleto({ displays: 4, entregasFeitas: 0, titulosEmAberto: 0 })).toBe(7);
    expect(prazoDoBoleto({ displays: 8, entregasFeitas: 2, titulosEmAberto: 0 })).toBe(7);
  });

  it('14 dias no pedido de 4 displays ou mais, com 3 pedidos quitados', () => {
    expect(prazoDoBoleto({ displays: 4, entregasFeitas: 3, titulosEmAberto: 0 })).toBe(14);
    expect(prazoDoBoleto({ displays: 10, entregasFeitas: 7, titulosEmAberto: 1 })).toBe(14);
  });

  it('prazo liberado pelo Lucca vale no lugar da regra, desde o primeiro pedido', () => {
    expect(prazoDoBoleto({ displays: 6, entregasFeitas: 0, titulosEmAberto: 0, prazoLiberado: 14 })).toBe(14);
    expect(prazoDoBoleto({ displays: 2, entregasFeitas: 0, titulosEmAberto: 3, prazoLiberado: 14 })).toBe(14);
    expect(prazoDoBoleto({ displays: 6, entregasFeitas: 0, titulosEmAberto: 0, prazoLiberado: null })).toBe(7);
  });

  it('pedido pequeno segue em 7 dias, mesmo de cliente antigo', () => {
    expect(prazoDoBoleto({ displays: 3, entregasFeitas: 20, titulosEmAberto: 0 })).toBe(7);
    expect(prazoDoBoleto({ displays: 2, entregasFeitas: 3, titulosEmAberto: 0 })).toBe(7);
  });

  it('pedido entregue e ainda não pago não conta como quitado', () => {
    expect(prazoDoBoleto({ displays: 4, entregasFeitas: 3, titulosEmAberto: 1 })).toBe(7);
    expect(prazoDoBoleto({ displays: 4, entregasFeitas: 4, titulosEmAberto: 1 })).toBe(14);
  });
});

describe('bloqueio por atraso', () => {
  it('segura o pedido a partir de 2 dias de vencido', () => {
    expect([0, 1, 2, 3, 30].map(atrasoBloqueiaPedido)).toEqual([false, false, true, true, true]);
  });
});
