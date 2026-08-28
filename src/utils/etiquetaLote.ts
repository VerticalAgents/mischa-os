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
 * O rolo tem uma picotada a 18,5 mm do topo.
 *
 * No sistema de rastreabilidade, tudo o que precisa sobreviver ao destaque cabe
 * acima dela. Aqui o bloco do topo passa disso de propósito: com o nome em 10pt
 * (pedido do dono, porque em 8,5pt estava pequeno demais para ler de longe) e a
 * pílula maior, os dois não cabem em 15,5 mm.
 *
 * O que se perde: se alguém destacar a etiqueta na picotada, a pílula do volume
 * pode ser cortada ao meio em nomes de três linhas. O NOME continua inteiro
 * acima dela, que é o dado que não pode se perder.
 */
export const PICOTADA_MM = 18.5;

/** Altura do bloco do topo: nome (até 3 linhas de 10pt) + pílula. */
export const ALTURA_TOPO = 21;

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

  /*
    Sobra de linha: quando o último avanço do rolo tem menos de três pacotes, as
    etiquetas restantes seriam papel em branco. Viram a marca da casa.

    Elas continuam ocupando a coluna — é isso que mantém as etiquetas reais no
    lugar certo do rolo.
  */
  .marca {
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .marca img {
    width: 27mm;
    height: 27mm;
    display: block;
    /* A imagem já é de dois tons; qualquer suavização viraria cinza, que na
       térmica é chuvisco. */
    image-rendering: pixelated;
  }

  /* Rótulo de interface: maiúscula espaçada, como no app. */
  .rotulo {
    font-size: 5pt;
    font-weight: bold;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  /*
    Bloco que precisa sobreviver ao destaque da picotada: nome e volume.

    Altura fixa de propósito. A pílula é empurrada para o pé do bloco
    (margin-top auto), então ela cai sempre na mesma linha, tenha o nome uma
    ou três linhas — e nada abaixo dela se mexe.
  */
  .topo {
    height: ${ALTURA_TOPO}mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  /*
    O único negrito pesado da etiqueta: é o que se lê primeiro.

    Teto de três linhas. Sem ele, um nome comprido em 10pt ocupava cinco linhas
    e empurrava a pílula para fora do bloco — ela sumia justamente nas etiquetas
    em que mais importa. Nome maior que isso sai cortado com reticências: o
    começo do nome identifica o cliente, a pílula não tem substituto.
  */
  .cliente {
    /* Arial Narrow cabe ~30% mais caractere na mesma altura de letra, e existe
       em toda instalacao do Windows. Numa etiqueta de 34 mm isso e a diferenca
       entre o nome inteiro e o nome cortado. */
    font-family: "Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif;
    font-size: 10.5pt;
    font-weight: bold;
    line-height: 1.1;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    word-break: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
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

  /* Peso normal de propósito: com tudo em negrito, nada se destacava e o nome
     do cliente sumia no meio. */
  .data {
    font-size: 8.5pt;
    letter-spacing: -0.02em;
  }

  .meio {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /*
    A pílula fica no pé do bloco do nome, acima da régua.

    Como o bloco tem altura fixa, ela cai sempre na mesma linha e não empurra
    nada — que era o problema de quando ela morava no meio da etiqueta.
  */
  .slot-pilula {
    margin-top: auto;
    display: flex;
    justify-content: center;
  }

  /* "1 de 3" é o que a pessoa procura com a caixa na mão. */
  .pilula {
    display: inline-block;
    background: #000;
    color: #fff;
    border-radius: 99mm;
    padding: 1.3mm 3.6mm;
    font-size: 13pt;
    font-weight: bold;
    line-height: 1.05;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .unidades {
    font-size: 21pt;
    font-weight: bold;
    line-height: 1;
    letter-spacing: -0.03em;
  }

  .unidades span {
    font-size: 10pt;
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
    letter-spacing: -0.02em;
  }
`;
