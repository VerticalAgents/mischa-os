import type { ProporcaoPadrao } from "@/hooks/useSupabaseProporoesPadrao";

export interface ProdutoQuantidadeCalculada {
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  percentual: number;
}

/**
 * Calcula sincronamente as quantidades por produto para um pedido Padrão,
 * dado o total e a lista de proporções ativas vigentes.
 * Retorna [] se as proporções não somam 100% ou não há proporção válida.
 */
export function calcularQuantidadesPadrao(
  quantidadeTotal: number,
  proporcoes: ProporcaoPadrao[]
): ProdutoQuantidadeCalculada[] {
  if (!quantidadeTotal || !proporcoes || proporcoes.length === 0) return [];

  const ativas = proporcoes.filter(p => p.ativo && p.percentual > 0);
  if (ativas.length === 0) return [];

  const total = ativas.reduce((s, p) => s + Number(p.percentual), 0);
  if (Math.abs(total - 100) > 0.01) return [];

  const quantidades: Record<string, number> = {};
  let acumulado = 0;
  ativas.forEach(p => {
    const q = Math.floor((Number(p.percentual) / 100) * quantidadeTotal);
    quantidades[p.produto_id] = q;
    acumulado += q;
  });

  const residual = quantidadeTotal - acumulado;
  if (residual > 0) {
    const maior = ativas.reduce((a, b) =>
      Number(b.percentual) > Number(a.percentual) ? b : a
    );
    quantidades[maior.produto_id] += residual;
  }

  return ativas
    .filter(p => quantidades[p.produto_id] > 0)
    .map(p => ({
      produto_id: p.produto_id,
      produto_nome: p.produto_nome,
      quantidade: quantidades[p.produto_id],
      percentual: Number(p.percentual),
    }));
}