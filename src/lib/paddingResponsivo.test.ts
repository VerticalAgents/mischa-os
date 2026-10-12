import { describe, it, expect } from 'vitest';
import { cn } from './utils';
import { espelharPadding } from './paddingResponsivo';

// O padrao de fabrica do CardContent.
const BASE = 'p-4 pt-0 sm:p-6 sm:pt-0';
const classes = (className?: string) => cn(BASE, espelharPadding(className)).split(' ').sort();

describe('espelharPadding', () => {
  it('sem className, fica o padrao de fabrica', () => {
    expect(classes()).toEqual(BASE.split(' ').sort());
  });

  it('p-4 vale tambem no computador (o topo nao volta para zero)', () => {
    expect(classes('p-4')).toEqual(['p-4', 'sm:p-4']);
  });

  it('pt-6 tira o topo zerado nas duas telas e mantem as laterais de fabrica', () => {
    expect(classes('pt-6')).toEqual(['p-4', 'pt-6', 'sm:p-6', 'sm:pt-6']);
  });

  it('sm: escrito de proposito vence o par automatico', () => {
    expect(classes('p-4 sm:p-5')).toEqual(['p-4', 'sm:p-5']);
  });

  it('nao mexe em classe que nao e padding', () => {
    expect(espelharPadding('flex gap-2 text-sm')).toBe('flex gap-2 text-sm');
    expect(espelharPadding('space-y-2 pb-2')).toBe('sm:pb-2 space-y-2 pb-2');
  });
});
