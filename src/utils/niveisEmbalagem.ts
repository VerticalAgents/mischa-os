export interface NivelEmbalagem {
  id: string;
  produto_id: string;
  nome: string;
  abreviacao: string;
  unidades_por_nivel: number;
  ordem: number;
}

/** Nível "Unidade" implícito, sempre presente. */
export const NIVEL_UNIDADE: NivelEmbalagem = {
  id: "__un__",
  produto_id: "",
  nome: "Unidade",
  abreviacao: "Un.",
  unidades_por_nivel: 1,
  ordem: 0,
};

/** Retorna a lista completa de níveis (Unidade + configurados), ordenada. */
export function niveisComUnidade(niveis: NivelEmbalagem[]): NivelEmbalagem[] {
  const extras = [...niveis].sort(
    (a, b) => a.ordem - b.ordem || a.unidades_por_nivel - b.unidades_por_nivel
  );
  return [NIVEL_UNIDADE, ...extras];
}

/** Dado um total em unidades, infere o maior nível cujo fator divide exatamente. */
export function inferirNivel(
  unidades: number,
  niveis: NivelEmbalagem[]
): NivelEmbalagem {
  const todos = niveisComUnidade(niveis);
  // Percorre do maior para o menor
  const ordenado = [...todos].sort(
    (a, b) => b.unidades_por_nivel - a.unidades_por_nivel
  );
  for (const n of ordenado) {
    if (unidades > 0 && unidades % n.unidades_por_nivel === 0) return n;
  }
  return NIVEL_UNIDADE;
}

/** Converte quantidade em um nível para unidades. */
export function converterParaUnidades(
  quantidade: number,
  nivel: NivelEmbalagem | undefined
): number {
  if (!nivel) return quantidade;
  return Math.round(quantidade * nivel.unidades_por_nivel);
}

/** Divide unidades por fator do nível (para exibição no input). */
export function converterParaNivel(
  unidades: number,
  nivel: NivelEmbalagem | undefined
): number {
  if (!nivel || nivel.unidades_por_nivel <= 1) return unidades;
  return unidades / nivel.unidades_por_nivel;
}
