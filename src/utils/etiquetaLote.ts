/**
 * Etiquetas de pacote no rolo "Lote" da Zebra TLP 2844.
 *
 * A geometria não foi escolhida aqui: veio de
 * `IA/Projetos/MischaFlex/docs/ETIQUETAS_TLP2844.md`, que descreve o rolo em uso
 * e custou uma sessão inteira de tentativa e erro. Os números descrevem papel
 * físico — mudar um deles sem trocar o rolo faz a impressão sair torta.
 *
 * O fato que decide tudo: **a página é uma LINHA do rolo, não uma etiqueta.**
 * O rolo tem três colunas, e a impressora avança a linha inteira. Então o que o
 * navegador imprime como "página" são as três etiquetas lado a lado.
 */

/** Medidas do rolo, em milímetros. */
export const ROLO = {
  largura: 34,
  altura: 65,
  colunas: 3,
  /** Vão entre colunas. */
  espaco: 2.5,
  /** Margem nas laterais da linha. */
  margem: 2,
  /**
   * Vão entre linhas fica ZERO de propósito: o driver já conhece o vão de 3 mm
   * (Gap/Mark Height) e o sensor cuida do avanço. Somar de novo faz a impressão
   * escorregar 3 mm por linha.
   */
  espacoLinha: 0,
  /** Ajuste fino medido na impressora: move o conteúdo, não a página. */
  deslocarY: -1,
  deslocarX: 0,
} as const;

/** Largura da página = uma linha inteira do rolo. Dá 111 mm com o rolo atual. */
export const LARGURA_LINHA =
  2 * ROLO.margem + ROLO.colunas * ROLO.largura + (ROLO.colunas - 1) * ROLO.espaco;

export const ALTURA_LINHA = ROLO.altura + ROLO.espacoLinha;

/**
 * O rolo tem uma picotada a 18,5 mm do topo. O que precisa sobreviver ao
 * destaque fica acima dela — aqui, o nome do cliente.
 */
export const PICOTADA_MM = 18.5;

/** Escapa texto vindo do banco antes de entrar no HTML de impressão. */
export const escapar = (valor: unknown): string =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * CSS da folha de etiquetas.
 *
 * Impressão térmica não tem meio-tom: cinza vira pontilhado e some em corpo
 * pequeno. Todo texto é preto, e a hierarquia vem de tamanho e peso.
 */
export const estilosEtiquetaLote = (): string => `
  @page {
    size: ${LARGURA_LINHA}mm ${ALTURA_LINHA}mm;
    margin: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Uma linha do rolo = uma página. */
  .linha {
    width: ${LARGURA_LINHA}mm;
    height: ${ALTURA_LINHA}mm;
    padding: 0 ${ROLO.margem}mm;
    box-sizing: border-box;
    display: flex;
    gap: ${ROLO.espaco}mm;
    align-items: flex-start;
    overflow: hidden;
    transform: translate(${ROLO.deslocarX}mm, ${ROLO.deslocarY}mm);
    page-break-after: always;
    break-after: page;
  }

  .linha:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .etiqueta {
    width: ${ROLO.largura}mm;
    height: ${ROLO.altura}mm;
    padding: 1.5mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Espaço vazio quando a última linha tem menos de três pacotes: mantém as
     etiquetas restantes nas colunas certas. */
  .vazia { visibility: hidden; }

  /* Bloco que precisa sobreviver ao destaque da picotada. */
  .topo {
    height: ${PICOTADA_MM - 2.5}mm;
    overflow: hidden;
  }

  .cliente {
    font-size: 8.5pt;
    font-weight: bold;
    line-height: 1.05;
    text-transform: uppercase;
    word-break: break-word;
  }

  .data {
    font-size: 8pt;
    font-weight: bold;
    margin-top: 1mm;
  }

  .meio {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  /* "1 de 3" é o que a pessoa procura com a caixa na mão: é o maior da etiqueta. */
  .volume {
    font-size: 14pt;
    font-weight: bold;
    line-height: 1;
  }

  .unidades {
    font-size: 11pt;
    font-weight: bold;
    margin-top: 1.5mm;
  }

  .rodape {
    border-top: 1px solid #000;
    padding-top: 1mm;
    font-size: 7pt;
    line-height: 1.2;
  }

  .rodape strong { font-size: 8pt; }
`;
