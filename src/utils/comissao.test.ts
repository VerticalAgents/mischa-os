import { describe, expect, it } from 'vitest';
import {
  acertoDaNota,
  comissaoEmCentavos,
  descricaoDaConta,
  diasParaVirarDesconto,
  fecharQuinzena,
  notaConta,
  quinzenaAnterior,
  quinzenaDe,
  quinzenaFechada,
  quinzenasAte,
  situacaoDaConta,
  situacaoDoBoleto,
  unidadesDaNota,
} from './comissao';

describe('quinzena e dia de pagamento', () => {
  it('1 a 15 paga no dia 16', () => {
    expect(quinzenaDe('2026-10-01')).toEqual({ inicio: '2026-10-01', fim: '2026-10-15', pagamento: '2026-10-16' });
    expect(quinzenaDe('2026-10-15').pagamento).toBe('2026-10-16');
  });
  it('16 ao fim do mês paga no dia 1º seguinte', () => {
    expect(quinzenaDe('2026-10-16')).toEqual({ inicio: '2026-10-16', fim: '2026-10-31', pagamento: '2026-11-01' });
    expect(quinzenaDe('2026-11-30').fim).toBe('2026-11-30');
    expect(quinzenaDe('2027-02-20').fim).toBe('2027-02-28');
  });
  it('vira o ano', () => {
    expect(quinzenaDe('2026-12-31').pagamento).toBe('2027-01-01');
    expect(quinzenaAnterior(quinzenaDe('2027-01-05')).inicio).toBe('2026-12-16');
  });
  it('fim de semana não muda a data', () => {
    // 16/05/2027 é domingo
    expect(quinzenaDe('2027-05-10').pagamento).toBe('2027-05-16');
  });
  it('só fecha depois do último dia', () => {
    const q = quinzenaDe('2026-10-20');
    expect(quinzenaFechada(q, '2026-10-31')).toBe(false);
    expect(quinzenaFechada(q, '2026-11-01')).toBe(true);
  });
  it('lista as quinzenas para trás', () => {
    expect(quinzenasAte('2026-10-15', 3).map((q) => q.inicio)).toEqual(['2026-10-01', '2026-09-16', '2026-09-01']);
  });
});

describe('a nota', () => {
  const nota = {
    situacao_nf: 'Aprovada',
    codigo_cfop: '5102',
    produtos: [
      { cfop: '5102', quantidade: '15.00' },
      { cfop: '5102', quantidade: '21.00' },
    ],
  };
  it('conta os brownies de venda', () => {
    expect(unidadesDaNota(nota)).toBe(36);
    expect(unidadesDaNota({ produtos: [{ cfop: '5910', quantidade: '5' }, { cfop: '5102', quantidade: '18' }] })).toBe(18);
  });
  it('cancelada e devolução ficam fora', () => {
    expect(notaConta(nota)).toBe(true);
    expect(notaConta({ ...nota, situacao_nf: 'Corrigida' })).toBe(true);
    expect(notaConta({ ...nota, situacao_nf: 'Cancelada' })).toBe(false);
    expect(notaConta({ ...nota, codigo_cfop: '5902' })).toBe(false);
  });
  it('R$ 0,85 por brownie, em centavos', () => {
    expect(comissaoEmCentavos(36, '0.85')).toBe(3060);
  });
});

describe('desconto do não pago', () => {
  const b = (data_vencimento: string, liquidado: string) => ({ data_vencimento, liquidado });
  it('atrasado só com 2 dias de vencido', () => {
    expect(situacaoDoBoleto([b('2026-10-22', '0')], '2026-10-23')).toBe('em_dia');
    expect(situacaoDoBoleto([b('2026-10-22', '0')], '2026-10-24')).toBe('atrasado');
    expect(situacaoDoBoleto([b('2026-10-22', '1')], '2026-11-30')).toBe('pago');
    expect(situacaoDoBoleto([], '2026-11-30')).toBe('sem_boleto');
  });
  it('desconta uma vez e devolve uma vez', () => {
    expect(acertoDaNota({ descontada: false, situacao: 'atrasado' })).toBe('descontar');
    expect(acertoDaNota({ descontada: true, situacao: 'atrasado' })).toBeNull();
    expect(acertoDaNota({ descontada: true, situacao: 'pago' })).toBe('devolver');
    expect(acertoDaNota({ descontada: false, situacao: 'pago' })).toBeNull();
  });
});

describe('o que o representante vê', () => {
  const b = (data_vencimento: string, liquidado: string) => ({ data_vencimento, liquidado });
  it('boleto vencido há 1 dia: falta 1 dia para virar desconto', () => {
    expect(diasParaVirarDesconto([b('2026-10-22', '0')], '2026-10-23')).toBe(1);
    expect(diasParaVirarDesconto([b('2026-10-22', '0')], '2026-10-22')).toBeNull();
    expect(diasParaVirarDesconto([b('2026-10-22', '0')], '2026-10-24')).toBeNull();
    expect(diasParaVirarDesconto([b('2026-10-22', '1')], '2026-10-23')).toBeNull();
  });
  it('conta da comissão: recebida, a receber, atrasada', () => {
    expect(situacaoDaConta({ liquidado: '1', data_vencimento: '2026-11-01' }, '2026-11-05')).toBe('recebida');
    expect(situacaoDaConta({ liquidado: '0', data_vencimento: '2026-11-01' }, '2026-11-01')).toBe('a_receber');
    expect(situacaoDaConta({ liquidado: '0', data_vencimento: '2026-11-01' }, '2026-11-02')).toBe('atrasada');
  });
});

describe('fechamento', () => {
  it('bruto menos desconto mais crédito', () => {
    expect(fecharQuinzena({ bruto: 10000, descontos: 3060, creditos: 1530 })).toMatchObject({ liquido: 8470, saldoProximo: 0 });
  });
  it('nunca fica negativo: o resto passa adiante', () => {
    expect(fecharQuinzena({ bruto: 1000, descontos: 3060, creditos: 0 })).toMatchObject({ liquido: 0, saldoProximo: 2060 });
    expect(fecharQuinzena({ bruto: 5000, descontos: 0, creditos: 0, saldoAnterior: 2060 })).toMatchObject({ liquido: 2940, saldoProximo: 0 });
  });
  it('descrição da conta', () => {
    expect(descricaoDaConta('Tiago', quinzenaDe('2026-10-20'), 3, 108)).toBe('Comissão Tiago 16/10 a 31/10/2026 (3 notas, 108 brownies)');
    expect(descricaoDaConta('Luis', quinzenaDe('2026-10-02'), 1, 36, true)).toBe(
      'Comissão Luis 01/10 a 15/10/2026 (1 nota, 36 brownies), parcial',
    );
  });
});
