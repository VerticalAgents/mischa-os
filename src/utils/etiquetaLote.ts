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
 * O sistema visual do app não atravessa inteiro para a térmica: não existe cor,
 * não existe cinza (vira pontilhado e some em corpo pequeno) e não existe
 * sombra. O que atravessa são os princípios — hierarquia por tamanho e peso,
 * rótulo em maiúscula espaçada, a pílula de marcação e o alinhamento firme.
 *
 * A pílula do volume é o equivalente térmico da marcação "você está aqui" do
 * app: lá é marca da casa a 12%, aqui é preto cheio com texto vazado, porque é
 * o único jeito de destacar sem cor.
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
    padding: 2mm 2.2mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Espaço vazio quando a última linha tem menos de três pacotes: mantém as
     etiquetas restantes nas colunas certas. */
  .vazia { visibility: hidden; }

  /* Rótulo de interface: maiúscula espaçada, como no app. */
  .rotulo {
    font-size: 5pt;
    font-weight: bold;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  /* Bloco que precisa sobreviver ao destaque da picotada. */
  .topo {
    height: ${PICOTADA_MM - 3}mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .cliente {
    font-size: 8.5pt;
    font-weight: bold;
    line-height: 1.08;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    word-break: break-word;
  }

  .regua {
    height: 0;
    border-top: 0.35mm solid #000;
    margin: 1.4mm 0;
  }

  .entrega {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1mm;
  }

  .data {
    font-size: 8.5pt;
    font-weight: bold;
    letter-spacing: -0.02em;
  }

  .meio {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2mm;
  }

  /* "1 de 3" é o que a pessoa procura com a caixa na mão. */
  .pilula {
    display: inline-block;
    background: #000;
    color: #fff;
    border-radius: 99mm;
    padding: 1.1mm 3mm;
    font-size: 11pt;
    font-weight: bold;
    line-height: 1.05;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .unidades {
    font-size: 15pt;
    font-weight: bold;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .unidades span {
    font-size: 8pt;
    font-weight: bold;
    letter-spacing: 0;
  }

  .rodape {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1mm;
    border-top: 0.35mm solid #000;
    padding-top: 1.2mm;
  }

  .total {
    font-size: 8.5pt;
    font-weight: bold;
    letter-spacing: -0.02em;
  }
`;
