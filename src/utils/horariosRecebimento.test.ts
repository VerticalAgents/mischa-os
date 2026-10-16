import { describe, expect, it } from 'vitest';
import {
  diaDaData,
  diasQueRecebem,
  horarioNaData,
  horariosDosDias,
  lerHorarios,
  resumoHorarios,
  textoDoDia,
  validarHorarios,
} from './horariosRecebimento';

const manhaETarde = [
  { de: '09:00', ate: '12:00' },
  { de: '14:00', ate: '16:00' },
];

describe('horário de recebimento', () => {
  it('lê o banco e ignora o que não presta', () => {
    expect(lerHorarios(null)).toBeNull();
    expect(lerHorarios({})).toBeNull();
    expect(lerHorarios({ Seg: [{ de: '09:00', ate: '12:00' }, { de: 'x', ate: '1' }], Xyz: [] })).toEqual({
      Seg: [{ de: '09:00', ate: '12:00' }],
    });
  });

  it('começa pelos dias do janelas_entrega, nos dois jeitos de escrever', () => {
    expect(horariosDosDias(['Seg', 'quarta', 'sexta'])).toEqual({ Seg: [], Qua: [], Sex: [] });
    expect(diasQueRecebem({ Sex: [], Seg: manhaETarde })).toEqual(['Seg', 'Sex']);
  });

  it('valida as faixas', () => {
    expect(validarHorarios({ Seg: manhaETarde })).toBeNull();
    expect(validarHorarios({ Seg: [{ de: '12:00', ate: '09:00' }] })).toMatch(/antes do fim/);
    expect(validarHorarios({ Seg: [{ de: '09:00', ate: '13:00' }, { de: '12:00', ate: '16:00' }] })).toMatch(/sobrepõem/);
    expect(validarHorarios({ Seg: [{ de: '', ate: '12:00' }] })).toMatch(/preencha/);
  });

  it('texto de um dia', () => {
    expect(textoDoDia(manhaETarde)).toBe('9h–12h e 14h–16h');
    expect(textoDoDia([{ de: '14:30', ate: '18:00' }])).toBe('14h30–18h');
    expect(textoDoDia([])).toBe('o dia todo');
    expect(textoDoDia([{ de: '14:00', ate: '23:59' }])).toBe('a partir das 14h');
    expect(textoDoDia([{ de: '00:00', ate: '12:00' }])).toBe('até 12h');
    expect(textoDoDia(undefined)).toBe('não recebe');
  });

  it('resumo junta dias seguidos iguais', () => {
    const h = { Seg: manhaETarde, Ter: manhaETarde, Qua: manhaETarde, Qui: manhaETarde, Sex: manhaETarde, Sáb: [{ de: '09:00', ate: '12:00' }] };
    expect(resumoHorarios(h)).toBe('Seg a Sex 9h–12h e 14h–16h · Sáb 9h–12h');
    expect(resumoHorarios({ Seg: [], Qua: [] })).toBe('Seg o dia todo · Qua o dia todo');
    expect(resumoHorarios(null)).toBe('');
  });

  it('o horário no dia da entrega', () => {
    expect(diaDaData('2026-10-16')).toBe('Sex');
    expect(horarioNaData({ Sex: [{ de: '14:00', ate: '18:00' }] }, '2026-10-16')).toBe('recebe 14h–18h');
    expect(horarioNaData({ Seg: [] }, '2026-10-16')).toBe('não recebe Sex');
    expect(horarioNaData({ Sex: [] }, '2026-10-16')).toBeNull();
    expect(horarioNaData(null, '2026-10-16')).toBeNull();
  });
});
