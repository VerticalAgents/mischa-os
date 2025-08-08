
export type MovTipo = 'entrada' | 'saida' | 'ajuste';

export function asMovTipo(t: string): MovTipo {
  const v = (t || '').toLowerCase();
  return (v === 'entrada' || v === 'saida' || v === 'ajuste') ? v : 'ajuste';
}
