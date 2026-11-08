/**
 * Venda direta: cliente atendido pela propria Mischa's, sem representante.
 *
 * No banco nao existe campo proprio: `representante_id` vazio e venda direta.
 * Ate 04/11/2026 isso era o representante "001- MISCHA'S" (id 4), hoje inativo.
 * Os filtros de representante usam -1 para esta opcao.
 */
export const VENDA_DIRETA_ID = -1;
export const VENDA_DIRETA_ROTULO = "Venda direta";

/** Filtro de varias escolhas: lista vazia e "todos"; -1 casa com quem nao tem representante. */
export const casaComFiltroRepresentante = (
  selecionados: number[],
  representanteId: number | null | undefined,
): boolean => {
  if (selecionados.length === 0) return true;
  if (!representanteId) return selecionados.includes(VENDA_DIRETA_ID);
  return selecionados.includes(representanteId);
};

/** Filtro de uma escolha, com o id em texto ("todos", "-1", "14"). */
export const casaComValorRepresentante = (
  valor: string,
  representanteId: number | null | undefined,
): boolean => {
  if (valor === "todos") return true;
  if (valor === String(VENDA_DIRETA_ID)) return !representanteId;
  return representanteId?.toString() === valor;
};

/** Filtro por nome (analise de giro e curva ABC): vazio e "todos". */
export const casaComNomeRepresentante = (
  filtro: string | null | undefined,
  nome: string | null | undefined,
): boolean => {
  if (!filtro) return true;
  if (filtro === VENDA_DIRETA_ROTULO) return !nome;
  return nome === filtro;
};

export const nomeDoRepresentante = (
  representanteId: number | null | undefined,
  representantes: { id: number; nome: string }[],
): string => {
  if (!representanteId) return VENDA_DIRETA_ROTULO;
  return representantes.find((r) => r.id === representanteId)?.nome ?? `Rep #${representanteId}`;
};

/** Representantes que aparecem para escolher: os ativos e o atual do cliente, mesmo inativo. */
export const representantesParaEscolher = <T extends { id: number; ativo?: boolean }>(
  representantes: T[],
  atualId?: number | null,
): T[] => representantes.filter((r) => r.ativo !== false || r.id === atualId);
