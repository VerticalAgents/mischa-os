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
 * O nome do cliente cabe acima dela. A tarja Padrão/Alterado fica abaixo, de
 * propósito: o Lucca pediu 3 mm a mais de folga para nome comprido (09/10/2026).
 * Se alguém destacar na picotada, a tarja vai embora e o nome fica.
 */
export const PICOTADA_MM = 18.5;

/** Altura do bloco do topo: linha da pílula + nome (até 3 linhas) + tarja. */
export const ALTURA_TOPO = 23;

/**
 * Tamanho da letra do nome conforme o comprimento. A etiqueta tem 29,6 mm úteis:
 * em 10,5pt cabem uns 14 caracteres por linha, e nome como "Severo Garage
 * (Boulevard ...)" passava de três linhas e saía cortado.
 */
export const classeTamanhoNome = (nome: unknown): string => {
  const n = String(nome ?? "").trim().length;
  if (n > 40) return "nome-pp";
  if (n > 28) return "nome-p";
  return "";
};

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
    position: relative;
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
    etiquetas restantes ficam em branco — mas continuam ocupando a coluna, que é
    o que mantém as reais no lugar certo do rolo.
  */
  .vazia { visibility: hidden; }

  /* Rótulo de interface: maiúscula espaçada, como no app. */
  .rotulo {
    font-size: 5pt;
    font-weight: bold;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  /*
    Bloco que precisa sobreviver ao destaque da picotada: nome e tarja.

    Altura fixa de propósito. A tarja é empurrada para o pé do bloco
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
    e empurrava a tarja para fora do bloco. Nome maior que isso sai cortado com
    reticências: o começo do nome identifica o cliente.
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
    word-break: normal;
    overflow-wrap: anywhere;
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

  .cliente.nome-p { font-size: 8.5pt; }
  .cliente.nome-pp { font-size: 7.5pt; }

  /*
    Linha própria para a pílula, acima do nome. Quando ela ficava em cima do
    nome, roubava largura e o nome quebrava no meio da palavra (REDEVIP24 / H).
  */
  .linha-pilula {
    height: 3.2mm;
    display: flex;
    justify-content: flex-end;
    align-items: flex-start;
    flex: none;
  }

  /* Padrão ou Alterado. A térmica não tem cor: o que diferencia é preto cheio ou contorno. */
  .tarja {
    margin-top: auto;
    background: #000;
    color: #fff;
    text-align: center;
    font-size: 7pt;
    font-weight: bold;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 0.6mm 0;
    border: 0.3mm solid #000;
  }

  /* Padrão só com contorno: o preto cheio fica para o Alterado, que é o que
     pede atenção na separação (Lucca, 09/10/2026). */
  .tarja.contorno {
    background: #fff;
    color: #000;
  }

  .meio {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  /* "1 de 3": pequena, no canto de cima (pedido do Lucca, 09/10/2026). */
  .pilula {
    background: #000;
    color: #fff;
    border-radius: 99mm;
    padding: 0.4mm 1.4mm;
    font-size: 6.5pt;
    font-weight: bold;
    line-height: 1.1;
    white-space: nowrap;
  }

  /* Sabores do pedido inteiro. Com mais de um pacote, o número grande é aproximado. */
  .sabores {
    width: 100%;
    font-size: 7.5pt;
    line-height: 1.25;
    margin-bottom: 1mm;
  }

  .sabor {
    display: flex;
    justify-content: space-between;
    gap: 1mm;
  }

  .sabor b {
    font-weight: bold;
  }

  /* Unidades do pacote: acima dos sabores, alinhadas à esquerda (Lucca, 09/10/2026). */
  .bloco-un {
    align-self: stretch;
    text-align: left;
    margin-bottom: 3mm;
  }

  .com-sabores .unidades {
    font-size: 15pt;
  }

  /* Etiqueta de nano/mini: o nome do produto é o que se lê. */
  .produto {
    font-family: "Arial Narrow", "Liberation Sans Narrow", Arial, sans-serif;
    font-size: 11pt;
    font-weight: bold;
    line-height: 1.1;
    text-align: center;
    text-transform: uppercase;
  }

  .validade {
    font-size: 10pt;
    font-weight: bold;
    letter-spacing: -0.02em;
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
