export type Ingrediente = {
  id: string | number;
  nome: string;
  unidade: string;        // "g", "kg", "ml", "un", etc.
  quantidade: number;     // na receita base
  custo_unitario?: number;// R$ / unidade (opcional)
  custo_total?: number;   // R$ total do ingrediente na base (opcional)
};

export type Receita = {
  id: string | number;
  nome: string;
  rendimento_unidades: number; // ex.: 40
  peso_total_g: number;        // ex.: 2700
  custo_total: number;         // ex.: 35.11
  ingredientes: Ingrediente[];
  observacoes?: string;
};

export function roundSmart(n: number, dec = 2) {
  if (Math.abs(n) < 1) return Number(n.toFixed(3));
  return Number(n.toFixed(dec));
}

export function scaleRecipe(r: Receita, k: number) {
  const kf = Number(k) || 1;
  const ingredientes = r.ingredientes.map(ing => {
    const qtd = (ing.quantidade ?? 0) * kf;
    const custo = (ing.custo_total != null)
      ? (ing.custo_total * kf)
      : (ing.custo_unitario != null ? ing.custo_unitario * qtd : undefined);
    return {
      ...ing,
      quantidade_escalada: roundSmart(qtd),
      custo_total_escalado: (custo != null ? Number(custo.toFixed(2)) : undefined),
    };
  });

  const custo_total_escalado = Number((r.custo_total * kf).toFixed(2));
  const peso_total_g_escalado = roundSmart(r.peso_total_g * kf, 1);
  const rendimento_unidades_escalado = Math.round(r.rendimento_unidades * kf);

  return {
    ...r,
    k: kf,
    ingredientes,
    custo_total_escalado,
    peso_total_g_escalado,
    rendimento_unidades_escalado
  };
}