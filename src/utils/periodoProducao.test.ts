import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import {
  dataLocal,
  deslocamentoMinimo,
  montarJanela,
  rotuloIntervalo,
  rotuloNavegacao,
} from './periodoProducao';

const dia = (d: Date) => format(d, 'yyyy-MM-dd');
// Segunda-feira, 12/10/2026, no meio da tarde.
const HOJE = new Date(2026, 9, 12, 15, 30);

describe('dataLocal', () => {
  it('nao joga o dia 1 para o mes anterior', () => {
    expect(dia(dataLocal('2026-10-01'))).toBe('2026-10-01');
    expect(dataLocal('2026-10-01').getHours()).toBe(0);
  });
});

describe('montarJanela por mes', () => {
  it('abre terminando no ultimo mes fechado', () => {
    const j = montarJanela({ granularidade: 'mes', quantidade: 6, deslocamento: 0, hoje: HOJE });
    expect(j.buckets).toHaveLength(6);
    expect(dia(j.inicio)).toBe('2026-04-01');
    expect(dia(j.fim)).toBe('2026-09-30');
    expect(j.buckets.some(b => b.parcial)).toBe(false);
    expect(rotuloNavegacao(j)).toBe('abr/26 — set/26');
    expect(rotuloIntervalo(j)).toBe('01/04 a 30/09/2026');
  });

  it('a janela anterior tem o mesmo tamanho e encosta na atual', () => {
    const j = montarJanela({ granularidade: 'mes', quantidade: 6, deslocamento: 0, hoje: HOJE });
    expect(dia(j.anterior.inicio)).toBe('2025-10-01');
    expect(dia(j.anterior.fim)).toBe('2026-03-31');
  });

  it('o mes em andamento so entra com deslocamento +1, e fica fora das contas', () => {
    const j = montarJanela({ granularidade: 'mes', quantidade: 6, deslocamento: 1, hoje: HOJE });
    expect(dia(j.fim)).toBe('2026-10-31');
    expect(j.buckets[5].parcial).toBe(true);
    expect(j.fechados).toHaveLength(5);
    expect(rotuloIntervalo(j)).toBe('01/05 a 30/09/2026');
    // anterior: os 5 meses antes de maio
    expect(dia(j.anterior.inicio)).toBe('2025-12-01');
    expect(dia(j.anterior.fim)).toBe('2026-04-30');
  });

  it('voltar atravessa a virada do ano com meses inteiros', () => {
    const j = montarJanela({ granularidade: 'mes', quantidade: 3, deslocamento: -8, hoje: HOJE });
    expect(dia(j.inicio)).toBe('2025-11-01');
    expect(dia(j.fim)).toBe('2026-01-31');
  });
});

describe('montarJanela por semana', () => {
  it('semana vai de segunda a domingo e pode cruzar o mes', () => {
    const j = montarJanela({ granularidade: 'semana', quantidade: 2, deslocamento: 0, hoje: HOJE });
    expect(dia(j.buckets[0].inicio)).toBe('2026-09-28');
    expect(dia(j.buckets[0].fim)).toBe('2026-10-04');
    expect(j.buckets[0].labelLongo).toBe('28/09 a 04/10/2026');
    expect(dia(j.buckets[1].inicio)).toBe('2026-10-05');
    expect(dia(j.buckets[1].fim)).toBe('2026-10-11');
    expect(j.buckets[1].parcial).toBe(false);
  });
});

describe('montarJanela por dia', () => {
  it('termina ontem; hoje so entra com deslocamento +1', () => {
    const fechada = montarJanela({ granularidade: 'dia', quantidade: 7, deslocamento: 0, hoje: HOJE });
    expect(dia(fechada.inicio)).toBe('2026-10-05');
    expect(dia(fechada.fim)).toBe('2026-10-11');
    expect(fechada.fechados).toHaveLength(7);

    const comHoje = montarJanela({ granularidade: 'dia', quantidade: 7, deslocamento: 1, hoje: HOJE });
    expect(dia(comHoje.fim)).toBe('2026-10-12');
    expect(comHoje.buckets[6].parcial).toBe(true);
  });
});

describe('deslocamentoMinimo', () => {
  const primeira = dataLocal('2025-08-08');

  it('a janela mais antiga termina no periodo do primeiro registro', () => {
    const min = deslocamentoMinimo('mes', HOJE, primeira);
    const j = montarJanela({ granularidade: 'mes', quantidade: 6, deslocamento: min, hoje: HOJE });
    expect(dia(j.fim)).toBe('2025-08-31');
  });

  it('sem registro nenhum, nao volta', () => {
    expect(deslocamentoMinimo('semana', HOJE, null)).toBe(0);
  });
});
