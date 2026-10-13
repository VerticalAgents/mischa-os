import { describe, it, expect } from 'vitest';
import {
  canalDoItem,
  ehTerceirizacao,
  indexarProdutos,
  quantidadeNoCanal,
  quebrarPorCanal,
  resumoPorCanal,
  type OpcoesPrevistos,
} from './canalVenda';

const indice = indexarProdutos([
  { id: 'trad', nome: 'Brownie Tradicional', categoria_id: 1, peso_unitario: 65 },
  { id: 'avela', nome: 'Brownie Avelã', categoria_id: 1, peso_unitario: 65 },
  { id: 'mini', nome: 'Mini Brownie Tradicional', categoria_id: 2, peso_unitario: 2000 },
  { id: 'nano', nome: 'Nano Brownie Tradicional', categoria_id: 2, peso_unitario: 1000 },
  { id: 'odara', nome: 'Brownie Tradicional Odara', categoria_id: 4, peso_unitario: 65 },
]);

const pdv = { id: 'pdv', nome: 'Mercado', tipoCliente: 'PDV' };
const mica = { id: 'mica', nome: 'Brownie da Mica', tipoCliente: 'AMBOS' };
const odara = { id: 'odara', nome: 'Odara Alfajores', tipoCliente: 'INDUSTRIAL' };

const semPrevistos: OpcoesPrevistos = { incluirPrevistos: false, modo: 'provaveis', percentual: 50, score: () => 0 };

describe('de quem é o canal', () => {
  it('Industrial e Ambos são terceirização; PDV e sem tipo, não', () => {
    expect(ehTerceirizacao(odara)).toBe(true);
    expect(ehTerceirizacao(mica)).toBe(true);
    expect(ehTerceirizacao(pdv)).toBe(false);
    expect(ehTerceirizacao({ id: 'x' })).toBe(false);
    expect(ehTerceirizacao(null)).toBe(false);
  });

  it('o item segue a categoria do produto, a não ser que o cliente seja terceirização', () => {
    expect(canalDoItem(pdv, indice.porId.get('trad'))).toBe('revenda');
    expect(canalDoItem(pdv, indice.porId.get('mini'))).toBe('food_service');
    expect(canalDoItem(mica, indice.porId.get('trad'))).toBe('terceirizacao');
    expect(canalDoItem(pdv, undefined)).toBe('revenda');
  });
});

describe('quebra de um pedido', () => {
  it('Mica cai inteira em terceirização, mesmo comprando produto de revenda', () => {
    const q = quebrarPorCanal({
      cliente: mica,
      quantidadeTotal: 500,
      itens: [{ produto: 'Brownie Tradicional', quantidade: 250 }, { produto: 'Brownie Avelã', quantidade: 250 }],
    }, indice);
    expect(q).toEqual({ revendaUn: 0, foodServicePct: 0, foodServiceKg: 0, terceirizacaoUn: 500 });
  });

  it('pedido Padrão (sem itens) é todo revenda', () => {
    const q = quebrarPorCanal({ cliente: pdv, quantidadeTotal: 30, itens: null }, indice);
    expect(q.revendaUn).toBe(30);
    expect(q.foodServiceKg).toBe(0);
  });

  it('pedido misto reparte: revenda em unidades, food service em kg pelo peso do pacote', () => {
    const q = quebrarPorCanal({
      cliente: pdv,
      quantidadeTotal: 45,
      itens: [
        { produto: 'Brownie Tradicional', quantidade: 40 },
        { produto: 'Mini Brownie Tradicional', quantidade: 3 },
        { produto: 'Nano Brownie Tradicional', quantidade: 2 },
      ],
    }, indice);
    expect(q.revendaUn).toBe(40);
    expect(q.foodServicePct).toBe(5);
    expect(q.foodServiceKg).toBe(8);
    expect(quantidadeNoCanal(q, 'food_service')).toBe(8);
    expect(quantidadeNoCanal(q, 'revenda')).toBe(40);
    expect(quantidadeNoCanal(q, 'terceirizacao')).toBe(0);
  });

  it('acha o produto por id (entrega) e por nome sem ligar para maiúscula (agendamento)', () => {
    const porId = quebrarPorCanal({ cliente: pdv, itens: [{ produto_id: 'nano', quantidade: 3 }] }, indice);
    expect(porId.foodServiceKg).toBe(3);
    const porNome = quebrarPorCanal({ cliente: pdv, itens: [{ produto: 'mini brownie tradicional', quantidade: 1 }] }, indice);
    expect(porNome.foodServiceKg).toBe(2);
  });

  it('produto desconhecido e item zerado não quebram a conta', () => {
    const q = quebrarPorCanal({
      cliente: pdv,
      itens: [{ produto: 'Sabor que saiu de linha', quantidade: 10 }, { produto: 'Brownie Avelã', quantidade: 0 }],
    }, indice);
    expect(q.revendaUn).toBe(10);
  });
});

describe('resumo da semana', () => {
  const dados = {
    confirmados: [
      { cliente: mica, quantidadeTotal: 500, itens: [{ produto: 'Brownie Tradicional', quantidade: 500 }] },
      { cliente: pdv, quantidadeTotal: 30, itens: null },
    ],
    previstos: [
      { cliente: odara, quantidadeTotal: 5760, itens: [{ produto: 'Brownie Tradicional Odara', quantidade: 5760 }] },
      { cliente: { id: 'p2', nome: 'Café', tipoCliente: 'PDV' }, quantidadeTotal: 20, itens: null },
      { cliente: { id: 'p3', nome: 'Bar', tipoCliente: 'PDV' }, quantidadeTotal: 12,
        itens: [{ produto: 'Brownie Avelã', quantidade: 10 }, { produto: 'Mini Brownie Tradicional', quantidade: 2 }] },
    ],
    entregas: [
      { cliente: pdv, quantidadeTotal: 42, itens: [{ produto_id: 'trad', quantidade: 40 }, { produto_id: 'nano', quantidade: 2 }] },
    ],
    clientesTerceirizacao: [odara, mica, { id: 'morena', nome: 'Morena Cacau', tipoCliente: 'AMBOS' }],
  };

  it('separa os três canais e não deixa a Odara entrar na revenda', () => {
    const r = resumoPorCanal(dados, indice, semPrevistos);
    expect(r.revenda).toEqual({ confirmadas: 30, previstas: 30, entregues: 40, total: 70 });
    expect(r.foodService).toEqual({ confirmadas: 0, previstas: 4, entregues: 2, total: 2 });
    expect(r.terceirizacao.confirmadas).toBe(500);
    expect(r.terceirizacao.previstas).toBe(5760);
    expect(r.terceirizacao.total).toBe(500);
  });

  it('lista cada cliente de terceirização, do maior para o menor, inclusive o que está zerado', () => {
    const r = resumoPorCanal(dados, indice, semPrevistos);
    expect(r.terceirizacao.clientes.map(c => c.nome)).toEqual(['Odara Alfajores', 'Brownie da Mica', 'Morena Cacau']);
    expect(r.terceirizacao.clientes[0].previstas).toBe(5760);
    expect(r.terceirizacao.clientes[1].confirmadas).toBe(500);
    expect(r.terceirizacao.clientes[2].total).toBe(0);
  });

  it('modo prováveis: só o previsto com nota acima de 85 entra no total', () => {
    const r = resumoPorCanal(dados, indice, {
      incluirPrevistos: true, modo: 'provaveis', percentual: 50,
      score: id => (id === 'odara' ? 95 : id === 'p2' ? 85 : 90),
    });
    expect(r.terceirizacao.total).toBe(500 + 5760);
    // p2 tem 85 cravado (não passa); p3 passa com 10 de revenda e 4 kg de food service
    expect(r.revenda.total).toBe(30 + 40 + 10);
    expect(r.foodService.total).toBe(2 + 4);
  });

  it('modo percentual: entra a fração das previstas, arredondada para cima', () => {
    const r = resumoPorCanal(dados, indice, { incluirPrevistos: true, modo: 'percentual', percentual: 50, score: () => 0 });
    expect(r.revenda.total).toBe(30 + 40 + 15);
    expect(r.terceirizacao.total).toBe(500 + 2880);
  });

  it('a soma dos canais bate com o total de unidades dos pedidos (food service contado em pacotes)', () => {
    const todos = [...dados.confirmados, ...dados.previstos, ...dados.entregas];
    const somaPedidos = todos.reduce((s, p) => s + (p.quantidadeTotal ?? 0), 0);
    const somaCanais = todos
      .map(p => quebrarPorCanal(p, indice))
      .reduce((s, q) => s + q.revendaUn + q.foodServicePct + q.terceirizacaoUn, 0);
    expect(somaCanais).toBe(somaPedidos);
  });
});
