/**
 * Casos tirados do comportamento que o hook `useConfirmationScore` já tinha.
 * Servem para provar que extrair a fórmula não mudou nenhuma nota.
 */
import { describe, it, expect } from 'vitest';
import { calcularConfirmationScore, EntradaConfirmationScore } from './confirmationScore';

const entrada = (p: Partial<EntradaConfirmationScore>): EntradaConfirmationScore => ({
  entregas: [],
  reagendamentos: [],
  dataAgendada: new Date('2026-09-17T00:00:00'),
  ...p,
});

const entregasEm = (...datas: string[]) => datas.map((data) => ({ data }));

const reagendamento = (p: Partial<{
  data_original: string;
  tipo: string;
  created_at: string;
  agendamento_id: string | null;
}> = {}) => ({
  data_original: '2026-09-17',
  tipo: 'adiamento',
  created_at: '2026-09-01T12:00:00Z',
  agendamento_id: null,
  ...p,
});

describe('cliente sem histórico', () => {
  it('sem entrega nenhuma vale 70', () => {
    const r = calcularConfirmationScore(entrada({}));
    expect(r.score).toBe(70);
    expect(r.nivel).toBe('medio');
    expect(r.motivo).toContain('Cliente novo');
  });

  it('com uma entrega só vale 80 e cita a periodicidade', () => {
    const r = calcularConfirmationScore(
      entrada({ entregas: entregasEm('2026-09-03'), periodicidadePadrao: 7 })
    );
    expect(r.score).toBe(80);
    expect(r.motivo).toContain('7 dias');
  });

  it('sem periodicidade cadastrada, estima 14 dias', () => {
    const r = calcularConfirmationScore(entrada({ entregas: entregasEm('2026-09-03') }));
    expect(r.motivo).toContain('14 dias');
  });
});

describe('cadência', () => {
  it('entrega na data esperada fica em 95', () => {
    // Entregas de 14 em 14 dias; a próxima cai certinha em 14.
    const r = calcularConfirmationScore(
      entrada({
        entregas: entregasEm('2026-08-06', '2026-08-20', '2026-09-03'),
        dataAgendada: new Date('2026-09-17T00:00:00'),
      })
    );
    expect(r.score).toBe(95);
    expect(r.nivel).toBe('alto');
    expect(r.motivo).toContain('Cadência de 14 dias');
  });

  it('atraso vira bônus, limitado a 10 pontos', () => {
    const r = calcularConfirmationScore(
      entrada({
        entregas: entregasEm('2026-08-06', '2026-08-20', '2026-09-03'),
        dataAgendada: new Date('2026-10-17T00:00:00'), // 30 dias além
      })
    );
    expect(r.score).toBe(99); // 95 + 10, com teto em 99
  });

  // ATENÇÃO: as datas de entrega vêm do banco como 'yyyy-mm-dd' e o JavaScript
  // lê isso como meia-noite em Londres, ou seja, 21h do dia anterior aqui. Por
  // isso a conta enxerga um dia a menos do que se esperaria pelo calendário.
  // O comportamento abaixo é o que o app já fazia antes da extração; está
  // anotado como pendência para o Lucca decidir se corrige.
  it('adiantar demais tira ponto', () => {
    const r = calcularConfirmationScore(
      entrada({
        entregas: entregasEm('2026-08-06', '2026-08-20', '2026-09-03'),
        dataAgendada: new Date('2026-09-07T00:00:00'), // 10 dias antes
      })
    );
    // desvio lido como -9 → (|-9+3|) * 2 = 12 de penalidade
    expect(r.score).toBe(83);
    expect(r.motivo).toContain('baixa necessidade');
  });

  it('com só duas entregas a penalidade pesa metade', () => {
    const r = calcularConfirmationScore(
      entrada({
        entregas: entregasEm('2026-08-20', '2026-09-03'),
        dataAgendada: new Date('2026-09-07T00:00:00'),
      })
    );
    expect(r.score).toBe(89); // 95 - 12/2
  });
});

describe('reagendamento', () => {
  const base = {
    entregas: entregasEm('2026-08-06', '2026-08-20', '2026-09-03'),
    dataAgendada: new Date('2026-09-17T00:00:00'),
  };

  it('cada reagendamento tira 15', () => {
    const r = calcularConfirmationScore(
      entrada({ ...base, reagendamentos: [reagendamento()] })
    );
    expect(r.score).toBe(80);
    expect(r.fatores.penalidade_volatilidade).toBe(-15);
    expect(r.motivo).toContain('1 reagendamento');
  });

  it('remarcar em cima da hora tira 10 a mais', () => {
    const r = calcularConfirmationScore(
      entrada({
        ...base,
        reagendamentos: [reagendamento({ created_at: '2026-09-16T20:00:00Z' })],
      })
    );
    expect(r.fatores.penalidade_volatilidade).toBe(-25);
  });

  it('dois adiamentos no mesmo pedido tiram 20 extras', () => {
    const r = calcularConfirmationScore(
      entrada({
        ...base,
        reagendamentos: [
          reagendamento({ data_original: '2026-09-15' }),
          reagendamento({ data_original: '2026-09-16' }),
        ],
      })
    );
    expect(r.fatores.vetor_tendencia).toBe(-20);
    expect(r.score).toBe(45); // 95 - 30 - 20
    expect(r.nivel).toBe('baixo');
  });

  it('quem costuma adiantar ganha 5', () => {
    const r = calcularConfirmationScore(
      entrada({
        ...base,
        reagendamentos: [
          reagendamento({ tipo: 'adiantamento', data_original: '2026-07-01' }),
        ],
      })
    );
    // Longe da data agendada: não conta como reagendamento deste pedido,
    // mas conta na tendência.
    expect(r.fatores.penalidade_volatilidade).toBe(0);
    expect(r.fatores.vetor_tendencia).toBe(5);
    expect(r.score).toBe(99); // 95 + 5, com teto em 99
  });

  it('quando há id do agendamento, só os dele contam', () => {
    const r = calcularConfirmationScore(
      entrada({
        ...base,
        agendamentoId: 'ag-1',
        reagendamentos: [
          reagendamento({ agendamento_id: 'ag-1' }),
          reagendamento({ agendamento_id: 'ag-2' }),
        ],
      })
    );
    expect(r.fatores.penalidade_volatilidade).toBe(-15);
  });
});

describe('limites', () => {
  it('a nota não passa de 99 nem cai abaixo de 5', () => {
    const muitos = Array.from({ length: 10 }, (_, i) =>
      reagendamento({ data_original: '2026-09-17', created_at: `2026-09-0${(i % 9) + 1}T12:00:00Z` })
    );
    const r = calcularConfirmationScore(
      entrada({
        entregas: entregasEm('2026-08-06', '2026-08-20', '2026-09-03'),
        reagendamentos: muitos,
      })
    );
    expect(r.score).toBe(5);
  });
});
