import type { ClienteInadimplente } from "@/hooks/useInadimplencia";

/**
 * O relatório de inadimplência em texto puro, pronto para colar no WhatsApp.
 *
 * Texto e não PDF por um motivo prático: o destino quase sempre é uma conversa.
 * Texto cola em qualquer lugar, funciona no celular, e ainda dá para editar uma
 * linha antes de mandar — coisa que um anexo não permite.
 *
 * Por isso também nada de tabela alinhada por espaços: o WhatsApp usa fonte de
 * largura variável e qualquer colunagem desmonta. A hierarquia vem de recuo e
 * de marcadores.
 */

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** `yyyy-mm-dd` -> `dd/mm`. O ano só polui num relatório do mês corrente. */
const diaMes = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

const plural = (n: number, um: string, muitos: string) =>
  `${n} ${n === 1 ? um : muitos}`;

export interface OpcoesRelatorio {
  /** Data de emissão, injetada para o texto ser testável. */
  hojeBR: string;
  /** Linha de contexto: representante filtrado, busca aplicada, etc. */
  subtitulo?: string;
  /** `true` = só títulos vencidos; `false` = tudo o que está em aberto. */
  somenteAtrasados: boolean;
}

export function montarRelatorioInadimplencia(
  clientes: ClienteInadimplente[],
  { hojeBR, subtitulo, somenteAtrasados }: OpcoesRelatorio
): string {
  const titulosDoCliente = (c: ClienteInadimplente) =>
    (somenteAtrasados ? c.titulos.filter((t) => t.atrasado) : c.titulos)
      .slice()
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

  // Cliente que ficaria sem nenhuma linha não entra: um nome sozinho, sem
  // título, faria a pessoa procurar o que não está lá.
  const comTitulos = clientes
    .map((c) => ({ cliente: c, titulos: titulosDoCliente(c) }))
    .filter((x) => x.titulos.length > 0);

  const cabecalho = [
    `*INADIMPLÊNCIA — ${hojeBR}*`,
    subtitulo || null,
  ].filter(Boolean);

  if (comTitulos.length === 0) {
    return [...cabecalho, "", "Nenhum título em aberto nos filtros atuais."].join("\n");
  }

  const total = comTitulos.reduce(
    (s, { titulos }) => s + titulos.reduce((t, x) => t + x.valor, 0),
    0
  );

  cabecalho.push(
    `${plural(comTitulos.length, "cliente", "clientes")} · ${brl(total)}${
      somenteAtrasados ? " em atraso" : " em aberto"
    }`
  );

  // Do maior devedor para o menor: quem lê quer saber onde está o dinheiro.
  const corpo = comTitulos
    .map(({ cliente, titulos }) => ({
      cliente,
      titulos,
      soma: titulos.reduce((t, x) => t + x.valor, 0),
    }))
    .sort((a, b) => b.soma - a.soma)
    .map(({ cliente, titulos, soma }, i) => {
      const piorAtraso = titulos.reduce((m, t) => Math.max(m, t.diasAtraso), 0);

      const resumo = [
        plural(titulos.length, "título", "títulos"),
        piorAtraso > 0 ? `maior atraso ${plural(piorAtraso, "dia", "dias")}` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const linhas = titulos.map((t) => {
        const atraso = t.atrasado ? ` (${plural(t.diasAtraso, "dia", "dias")})` : "";
        return `   • Venc ${diaMes(t.dataVencimento)} — ${brl(t.valor)}${atraso}`;
      });

      return [
        `${i + 1}) *${cliente.clienteNome}* — ${brl(soma)}`,
        `   ${resumo}`,
        ...linhas,
      ].join("\n");
    })
    .join("\n\n");

  return [...cabecalho, "", corpo].join("\n");
}
