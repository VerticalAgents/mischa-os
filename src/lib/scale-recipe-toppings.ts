export type Ingrediente = {
  id: string | number;
  nome: string;
  unidade: string;     // "g","kg","ml","un", etc.
  quantidade: number;  // quantidade da receita base (1 forma)
};

export type Receita = {
  id: string | number;
  nome: string;
  rendimento_unidades: number;
  peso_total_g?: number;   // preferencialmente fornecido; se ausente, tentamos somar g/kg da base
  ingredientes: Ingrediente[];
  observacoes?: string;
};

function toGrams(q: number, unidade?: string): number | null {
  const u = (unidade || "").toLowerCase();
  if (u === "g") return q;
  if (u === "kg") return q * 1000;
  return null; // não somamos em massa
}

export function scaleWithToppings(
  r: Receita,
  k: number,
  toppingIds: Set<string>,
  perFormOverrides: Record<string, number> = {}
) {
  const forms = Number(k) || 1;

  const baseIngs: (Ingrediente & { qtd_total: number; qtd_g?: number })[] = [];
  const toppingIngs: (Ingrediente & { per_form_g?: number; total_g?: number })[] = [];

  r.ingredientes.forEach((ing) => {
    const id = String(ing.id);
    if (toppingIds.has(id)) {
      // topping: peso por forma (g) — default = quantidade (se unidade for g/kg)
      const defaultPerFormG = toGrams(ing.quantidade, ing.unidade) ?? undefined;
      const perForm = perFormOverrides[id] ?? defaultPerFormG;
      const total = typeof perForm === "number" ? perForm * forms : undefined;
      toppingIngs.push({
        ...ing,
        per_form_g: perForm,
        total_g: total
      });
    } else {
      // massa: escala quantidade; somatório de g/kg para peso total na batedeira
      const qtdTotal = ing.quantidade * forms;
      const qtdG = toGrams(qtdTotal, ing.unidade) ?? undefined;
      baseIngs.push({ ...ing, qtd_total: qtdTotal, qtd_g: qtdG });
    }
  });

  // peso da massa na batedeira
  const base_total_g = baseIngs.reduce((acc, ing) => acc + (ing.qtd_g ?? 0), 0);

  // peso total de toppings
  const toppings_total_g = toppingIngs.reduce((acc, ing) => acc + (ing.total_g ?? 0), 0);

  // peso por forma da massa base (preferir campo da receita)
  const base_per_form_g =
    typeof r.peso_total_g === "number" && r.peso_total_g > 0
      ? r.peso_total_g
      : (forms > 0 ? Math.round(base_total_g / forms) : undefined);

  return {
    meta: {
      receita_id: r.id,
      receita_nome: r.nome,
      multiplicador: forms,
      forms_count: forms, // nº de formas
    },
    base: {
      per_form_g: base_per_form_g,     // massa por forma (se disponível)
      total_g: Math.round(base_total_g),
      ingredientes: baseIngs
    },
    toppings: {
      total_g: Math.round(toppings_total_g),
      ingredientes: toppingIngs
    },
    observacoes: r.observacoes ?? null
  };
}