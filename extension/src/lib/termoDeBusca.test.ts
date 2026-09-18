import { describe, it, expect } from 'vitest';
import { termoDeBusca } from './termoDeBusca';

describe('termoDeBusca', () => {
  it('pega a palavra que identifica o cliente', () => {
    // O caso que descobriu o problema: a conversa é "Jéssica - Curtir e
    // Celebrar", e procurar o nome inteiro do cadastro não achava nada.
    expect(termoDeBusca('Curtir e Celebrar Cestas')).toBe('Celebrar');
    expect(termoDeBusca('Mercado Santiago')).toBe('Santiago');
    expect(termoDeBusca('REDEVIP24H (Planetário)')).toBe('Planetário');
  });

  it('ignora palavra de razão social', () => {
    expect(termoDeBusca('Panetteria Comercio LTDA')).toBe('Panetteria');
  });

  it('nome curto demais vai inteiro', () => {
    expect(termoDeBusca('Bar do Zé')).toBe('Bar do Zé');
  });

  it('não devolve vazio', () => {
    expect(termoDeBusca('Loja')).toBe('Loja');
  });
});
