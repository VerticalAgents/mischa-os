
export type MovTipo = 'entrada' | 'saida' | 'ajuste';

export function asMovTipo(t: string): MovTipo {
  const v = (t || '').toLowerCase();
  return (v === 'entrada' || v === 'saida' || v === 'ajuste') ? v : 'ajuste';
}

export interface MovimentacaoEstoqueProduto {
  id: string;
  produto_id: string;
  tipo: MovTipo;
  quantidade: number;
  data_movimentacao: string;
  observacao?: string;
  created_at: string;
}

export interface MovimentacaoEstoqueInsumo {
  id: string;
  insumo_id: string;
  tipo: MovTipo;
  quantidade: number;
  data_movimentacao: string;
  observacao?: string;
  created_at: string;
}
