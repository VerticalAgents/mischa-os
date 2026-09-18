/**
 * Os textos que vão para o cliente, palavra por palavra.
 *
 * É aqui que um preço errado aparece antes de chegar no WhatsApp: qualquer
 * mudança nas regras comerciais faz um destes testes falhar de propósito.
 */
import { describe, it, expect } from 'vitest';
import {
  confirmarProximoPedido,
  lembreteDePagamento,
  resumoUltimosPedidos,
  sugestaoIgualUltimoPedido,
  avisoTrocasBonificacoes,
  tabelaDePrecos,
} from './mensagens';

describe('confirmar próxima reposição', () => {
  it('usa você, diz o dia da semana e lista os sabores', () => {
    const texto = confirmarProximoPedido({
      contato: 'John Silva',
      data: '2026-09-18',
      quantidade: 50,
      itens: [
        { produto: 'Brownie Avelã', quantidade: 15 },
        { produto: 'Brownie Meio Amargo', quantidade: 15 },
        { produto: 'Brownie Choco Duo', quantidade: 0 },
      ],
    });

    expect(texto).toContain('Oi, John, tudo bem?');
    expect(texto).toContain('Sua próxima reposição');
    expect(texto).toContain('sexta, 18/09');
    expect(texto).toContain('50 brownies');
    expect(texto).toContain('15 Avelã');
    // Sabor com quantidade zero não entra na mensagem.
    expect(texto).not.toContain('Choco Duo');
    expect(texto).toContain('Posso confirmar?');
  });

  it('sem nome de contato, cumprimenta sem nome', () => {
    const texto = confirmarProximoPedido({ data: '2026-09-18', quantidade: 30 });
    expect(texto.startsWith('Oi, tudo bem?')).toBe(true);
  });
});

describe('lembrete de pagamento', () => {
  it('fala da forma de pagamento do título, não de boleto por padrão', () => {
    const texto = lembreteDePagamento({
      contato: 'Ana',
      titulos: [{ valor: 240, dataVencimento: '2026-09-10', formaPagamento: 'PIX', diasAtraso: 7 }],
    });

    expect(texto).toContain('R$ 240,00, venceu em 10/09');
    expect(texto).not.toContain('—');
    expect(texto).toContain('venceu em 10/09');
    expect(texto).toContain('por pix');
    expect(texto).not.toContain('boleto');
    expect(texto).toContain('Se já pagou');
  });

  it('título a vencer não é cobrado como atraso', () => {
    const texto = lembreteDePagamento({
      titulos: [{ valor: 100, dataVencimento: '2026-09-30', diasAtraso: 0 }],
    });
    expect(texto).toContain('vence em 30/09');
    expect(texto).not.toContain('ficou em aberto');
  });

  it('soma o total quando há mais de um título', () => {
    const texto = lembreteDePagamento({
      titulos: [
        { valor: 100, dataVencimento: '2026-09-10', diasAtraso: 7 },
        { valor: 250.5, dataVencimento: '2026-09-20', diasAtraso: 0 },
      ],
    });
    expect(texto).toContain('Total: R$ 350,50');
  });

  it('sem título em aberto, não inventa cobrança', () => {
    expect(lembreteDePagamento({ titulos: [] })).toContain('tudo em dia');
  });
});

describe('últimos pedidos', () => {
  it('lista data, quantidade e sabores', () => {
    const texto = resumoUltimosPedidos({
      entregas: [
        {
          data: '2026-09-04',
          quantidade: 50,
          itens: [{ produto: 'Brownie Avelã', quantidade: 15 }],
        },
      ],
    });
    expect(texto).toContain('04/09, 50 un (15 Avelã)');
  });

  it('sem histórico, diz que não há', () => {
    expect(resumoUltimosPedidos({ entregas: [] })).toContain('Não encontrei entregas');
  });
});

describe('sugestão de reposição', () => {
  it('repetir o último pedido mostra a divisão de sabores', () => {
    const texto = sugestaoIgualUltimoPedido({
      contato: 'John',
      ultimaEntrega: {
        data: '2026-09-04',
        quantidade: 50,
        itens: [{ produto: 'Brownie Stikadinho', quantidade: 10 }],
      },
    });
    expect(texto).toContain('repetir o pedido de 04/09');
    expect(texto).toContain('10 Stikadinho');
  });

});

describe('trocas e bonificações', () => {
  it('lista as duas coisas separadas', () => {
    const texto = avisoTrocasBonificacoes({
      trocas: [{ produto: 'Brownie Tradicional', quantidade: 2 }],
      bonificacoes: [{ produto: 'Brownie Avelã', quantidade: 1 }],
    });
    expect(texto).toContain('Troca: 2 Tradicional');
    expect(texto).toContain('Bonificação: 1 Avelã');
  });
});

describe('tabela de preço', () => {
  it('ponto de venda: R$ 4,80, mínimo 30 e troca', () => {
    const texto = tabelaDePrecos();
    expect(texto).toContain('R$ 4,80');
    expect(texto).toContain('30 unidades, em múltiplos de 5');
    expect(texto).toContain('quarta e sexta');
    expect(texto).toContain('frete grátis');
    expect(texto).toContain('4 primeiros pedidos são à vista');
    expect(texto).toContain('60 dias');
    expect(texto).toContain('Trocamos sem custo');
  });

  it('ambulante: R$ 4,20, à vista e sem promessa de troca', () => {
    const texto = tabelaDePrecos({ ambulante: true });
    expect(texto).toContain('R$ 4,20');
    expect(texto).toContain('Pagamento à vista');
    expect(texto).not.toContain('Trocamos sem custo');
    expect(texto).not.toContain('R$ 4,80');
  });

  it('cita os cinco sabores ativos', () => {
    const texto = tabelaDePrecos();
    for (const s of ['Tradicional', 'Meio Amargo', 'Choco Duo', 'Stikadinho', 'Avelã']) {
      expect(texto).toContain(s);
    }
  });
});

describe('variações', () => {
  const pedido = { contato: 'John', data: '2026-09-18', quantidade: 50 };

  it('clicar de novo muda o jeito de dizer, não o conteúdo', () => {
    const um = confirmarProximoPedido(pedido, 0);
    const dois = confirmarProximoPedido(pedido, 1);

    expect(um).not.toBe(dois);
    // O que importa continua em todas elas.
    for (const texto of [um, dois]) {
      expect(texto).toContain('John');
      expect(texto).toContain('50 brownies');
      expect(texto).toContain('18/09');
    }
  });

  it('o mesmo número dá sempre o mesmo texto', () => {
    expect(confirmarProximoPedido(pedido, 3)).toBe(confirmarProximoPedido(pedido, 3));
  });

  it('as variações dão a volta em vez de acabar', () => {
    expect(confirmarProximoPedido(pedido, 20)).toBe(confirmarProximoPedido(pedido, 0));
  });

  it('a tabela de preço varia sem mexer em preço nem em regra', () => {
    for (const v of [0, 1, 2, 3]) {
      const texto = tabelaDePrecos({}, v);
      expect(texto).toContain('R$ 4,80');
      expect(texto).toContain('30 unidades, em múltiplos de 5');
    }
    expect(tabelaDePrecos({}, 0)).not.toBe(tabelaDePrecos({}, 1));
  });
});
