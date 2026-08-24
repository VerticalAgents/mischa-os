/**
 * O vocabulário de cores do fluxo de agendamento, num lugar só.
 *
 * Existe por causa da seção 12 do DESIGN.md: **cada variante precisa declarar
 * os dois temas**. Antes estas combinações estavam escritas à mão em oito
 * lugares deste painel, sempre só na versão clara — no tema escuro viravam
 * etiquetas claras sobre página escura, o defeito que o documento marca como o
 * mais caro de descobrir tarde.
 *
 * A regra que o documento dá: no claro, tinta clara + texto escuro
 * (`bg-verde-100` + `text-verde-800`); no escuro, o inverso (`bg-verde-950` +
 * `text-verde-200`). Não basta trocar o fundo.
 *
 * As cores em si NÃO são decorativas — elas são o estado do pedido, e é por
 * isso que não foram trocadas pela menta da marca: aqui a cor carrega
 * informação que o texto sozinho demoraria mais para entregar.
 */

/** Etiqueta de status. Pílula, por ser rótulo — nem bloco, nem controle. */
export const CHIP_STATUS = {
  confirmado:
    "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200 dark:border-green-900",
  separado:
    "bg-green-200 text-green-900 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
  despachado:
    "bg-green-400 text-green-950 border-green-500 dark:bg-green-700 dark:text-green-50 dark:border-green-600",
  previsto:
    "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-900",
  provavel:
    "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-900",
  entregue:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-900",
} as const;

/** Fundo da linha do pedido na lista do dia — mais discreto que a etiqueta. */
export const FUNDO_LINHA = {
  despachado: "bg-green-200 border-green-300 dark:bg-green-900/40 dark:border-green-800",
  separado: "bg-green-100 border-green-200 dark:bg-green-950/60 dark:border-green-900",
  confirmado: "bg-green-50 border-green-100 dark:bg-green-950/30 dark:border-green-900/60",
  provavel: "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-900",
  previsto: "bg-yellow-50 border-yellow-100 dark:bg-yellow-950/30 dark:border-yellow-900/60",
  neutro: "bg-muted/40 border-border",
} as const;

/** Bloco da entrega realizada. */
export const FUNDO_ENTREGA =
  "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900";

/** Chip pequeno de informação (dias desde a entrega, periodicidade, ritmo). */
export const CHIP_INFO = {
  neutro: "bg-muted text-muted-foreground",
  azul: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200",
  verde: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  amarelo: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200",
  vermelho: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
} as const;

/**
 * Botão de confirmar. Verde é o "positivo" do fluxo — não é a menta da marca,
 * que aqui significaria "primário" e competiria com o estado do pedido.
 */
export const BOTAO_CONFIRMAR =
  "bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600";
