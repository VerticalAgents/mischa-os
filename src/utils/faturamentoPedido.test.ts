import { describe, it, expect } from 'vitest';
import { indexarProdutos } from './canalVenda';
import { PRECO_SEM_TABELA, precoDaCategoria, valorDoPedido, type TabelaPrecos } from './faturamentoPedido';

const indice = indexarProdutos([
  { id: 'trad', nome: 'Brownie Tradicional', categoria_id: 1, peso_unitario: 65 },
  { id: 'avela', nome: 'Brownie Avelã', categoria_id: 1, peso_unitario: 65 },
  { id: 'mini', nome: 'Mini Brownie Tradicional', categoria_id: 2, peso_unitario: 2000 },
  { id: 'odara', nome: 'Brownie Tradicional Odara', categoria_id: 4, peso_unitario: 65 },
]);

const tabela: TabelaPrecos = {
  doCliente: new Map([
    ['mica_1', 2.89],
    ['odara_4', 1],
    ['caro_1', 5.2],
  ]),
  padrao: { '1': 4.8, '2': 75, '3': 0 },
};

const pdv = { id: 'pdv', nome: 'Mercado', tipoCliente: 'PDV', modeloPedido: 'padrao' };

describe('preço de uma categoria', () => {
  it('o preço do cliente vem antes do padrão da categoria', () => {
    expect(precoDaCategoria('mica', 1, tabela)).toBe(2.89);
    expect(precoDaCategoria('pdv', 1, tabela)).toBe(4.8);
    expect(precoDaCategoria('pdv', 2, tabela)).toBe(75);
  });

  it('sem preço nenhum cai nos R$ 4,50, como na venda do Gestão Click', () => {
    expect(precoDaCategoria('pdv', 3, tabela)).toBe(PRECO_SEM_TABELA);
    expect(precoDaCategoria('pdv', 9, tabela)).toBe(PRECO_SEM_TABELA);
    expect(precoDaCategoria('pdv', null, tabela)).toBe(PRECO_SEM_TABELA);
  });
});

describe('valor do pedido', () => {
  it('pedido Padrão: quantidade × preço da revenda', () => {
    expect(valorDoPedido({ cliente: pdv, quantidadeTotal: 30, itens: null }, indice, tabela)).toBeCloseTo(144);
    expect(valorDoPedido({ cliente: { ...pdv, id: 'caro' }, quantidadeTotal: 10 }, indice, tabela)).toBeCloseTo(52);
  });

  it('Mica paga o preço dela, não o da tabela', () => {
    const valor = valorDoPedido({
      cliente: { id: 'mica', tipoCliente: 'AMBOS' },
      quantidadeTotal: 500,
      itens: [{ produto: 'Brownie Tradicional', quantidade: 250 }, { produto: 'Brownie Avelã', quantidade: 250 }],
    }, indice, tabela);
    expect(valor).toBeCloseTo(1445);
  });

  it('Odara entra pelo preço cadastrado para a categoria dela', () => {
    const valor = valorDoPedido({
      cliente: { id: 'odara', tipoCliente: 'INDUSTRIAL' },
      quantidadeTotal: 5760,
      itens: [{ produto_id: 'odara', quantidade: 5760 }],
    }, indice, tabela);
    expect(valor).toBe(5760);
  });

  it('pedido misto: cada item pelo preço da sua categoria', () => {
    const pedido = {
      cliente: pdv,
      quantidadeTotal: 42,
      itens: [{ produto: 'Brownie Tradicional', quantidade: 40 }, { produto: 'Mini Brownie Tradicional', quantidade: 2 }],
    };
    expect(valorDoPedido(pedido, indice, tabela)).toBeCloseTo(40 * 4.8 + 2 * 75);
    expect(valorDoPedido(pedido, indice, tabela, 'revenda')).toBeCloseTo(192);
    expect(valorDoPedido(pedido, indice, tabela, 'food_service')).toBeCloseTo(150);
    expect(valorDoPedido(pedido, indice, tabela, 'terceirizacao')).toBe(0);
  });

  it('com filtro de canal, pedido de terceirização só conta em terceirização', () => {
    const pedido = { cliente: { id: 'mica', tipoCliente: 'AMBOS' }, quantidadeTotal: 100, itens: null };
    expect(valorDoPedido(pedido, indice, tabela, 'terceirizacao')).toBeCloseTo(289);
    expect(valorDoPedido(pedido, indice, tabela, 'revenda')).toBe(0);
  });
});

describe('quem pede em displays paga pela faixa da entrega', () => {
  const rep = { id: 'pdv-imigracao', tipoCliente: 'PDV', modeloPedido: 'displays' };

  it('2 displays (36 brownies) saem a R$ 4,95; 8 displays (144), a R$ 4,75', () => {
    expect(valorDoPedido({ cliente: rep, quantidadeTotal: 36, itens: [{ produto: 'Brownie Avelã', quantidade: 36 }] }, indice, tabela))
      .toBeCloseTo(36 * 4.95);
    expect(valorDoPedido({
      cliente: rep,
      quantidadeTotal: 144,
      itens: [{ produto: 'Brownie Avelã', quantidade: 72 }, { produto: 'Brownie Tradicional', quantidade: 72 }],
    }, indice, tabela)).toBeCloseTo(144 * 4.75);
  });

  it('a faixa não mexe no food service do mesmo pedido', () => {
    const valor = valorDoPedido({
      cliente: rep,
      quantidadeTotal: 37,
      itens: [{ produto: 'Brownie Avelã', quantidade: 36 }, { produto: 'Mini Brownie Tradicional', quantidade: 1 }],
    }, indice, tabela);
    expect(valor).toBeCloseTo(36 * 4.95 + 75);
  });
});
