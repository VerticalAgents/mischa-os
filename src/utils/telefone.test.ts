import { describe, it, expect } from 'vitest';
import { normalizarTelefoneBR, paraWaMe, mesmoTelefone } from './telefone';

describe('normalizarTelefoneBR', () => {
  it('aceita celular com DDD e máscara', () => {
    expect(normalizarTelefoneBR('(51) 99212-7961').e164).toBe('+5551992127961');
  });

  it('aceita telefone que já veio com o país', () => {
    expect(normalizarTelefoneBR('+55 51 99212-7961').e164).toBe('+5551992127961');
    expect(normalizarTelefoneBR('5551992127961').e164).toBe('+5551992127961');
  });

  it('aceita fixo de oito dígitos', () => {
    expect(normalizarTelefoneBR('5132112233').e164).toBe('+555132112233');
  });

  it('tira o zero de operadora', () => {
    expect(normalizarTelefoneBR('051 99212-7961').e164).toBe('+5551992127961');
  });

  it('devolve nulo quando não dá para reconhecer', () => {
    expect(normalizarTelefoneBR('').e164).toBeNull();
    expect(normalizarTelefoneBR(null).e164).toBeNull();
    expect(normalizarTelefoneBR('não tem').e164).toBeNull();
    expect(normalizarTelefoneBR('123').e164).toBeNull();
    // Número de fora do Brasil: não é nosso caso, melhor não adivinhar.
    expect(normalizarTelefoneBR('+1 415 555 2671').e164).toBeNull();
  });

  it('guarda o original como estava escrito', () => {
    expect(normalizarTelefoneBR('  (51) 99212-7961 ').original).toBe('(51) 99212-7961');
  });

  it('reconhece celular que a versão antiga descartava', () => {
    // A regra anterior exigia que o primeiro dígito fosse 9 — mas o primeiro
    // dígito é o do DDD, e nenhum DDD começa com 9.
    expect(normalizarTelefoneBR('11987654321').e164).toBe('+5511987654321');
  });
});

describe('paraWaMe', () => {
  it('devolve só dígitos, com o país e sem o mais', () => {
    expect(paraWaMe('(51) 99212-7961')).toBe('5551992127961');
  });

  it('devolve nulo em vez de montar link quebrado', () => {
    expect(paraWaMe('telefone do gerente')).toBeNull();
  });
});

describe('mesmoTelefone', () => {
  it('compara números escritos de jeitos diferentes', () => {
    expect(mesmoTelefone('(51) 99212-7961', '5551992127961')).toBe(true);
    expect(mesmoTelefone('51992127961', '+55 51 99212-7961')).toBe(true);
    expect(mesmoTelefone('51992127961', '51992127960')).toBe(false);
  });

  it('dois telefones ilegíveis não são o mesmo número', () => {
    expect(mesmoTelefone('', '')).toBe(false);
    expect(mesmoTelefone('abc', 'abc')).toBe(false);
  });
});
