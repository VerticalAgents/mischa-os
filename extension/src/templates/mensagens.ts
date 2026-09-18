/**
 * Os textos prontos do painel.
 *
 * Todas são funções puras: recebem o dado, devolvem o texto. Sem relógio
 * próprio, sem rede, sem React. É o que permite testar cada palavra, porque um
 * erro de preço aqui vai direto para o cliente.
 *
 * Nenhuma mensagem é enviada pela extensão. O texto cai na caixa de digitação,
 * o Lucca lê, ajusta se quiser, e manda ele mesmo.
 *
 * Tom, combinado com o Lucca em 17/09/2026: tratamento por "você", simpático e
 * cordial, escrito direito e com pouca pontuação. Nada de travessão nem de
 * exclamação a cada frase: frase curta, e quebra de linha no lugar da vírgula
 * comprida.
 *
 * **Por que cada mensagem tem variações:** mandar sempre o texto idêntico, para
 * todo mundo, toda semana, soa de robô e o cliente percebe. Cada função recebe
 * um número (`variante`) e escolhe outra forma de dizer a mesma coisa. O painel
 * avança esse número a cada clique no mesmo botão, então clicar de novo troca o
 * jeito sem mudar o conteúdo. A escolha é por índice, não sorteada: o mesmo
 * número dá sempre o mesmo texto, e por isso dá para testar.
 */
import { PRECOS, PEDIDO_MINIMO, SABORES, PRODUTO, ENTREGA, PAGAMENTO, TROCA, EXPOSITOR } from '@ext/config/comercial';

export interface ItemDeSabor {
  produto: string;
  quantidade: number;
}

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const comoData = (iso: string): string => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  return `${DIAS[d.getDay()]}, ${dia}/${mes}`;
};

const soData = (iso: string): string => {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00`);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const dinheiro = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

/** "Brownie Avelã" vira "Avelã": na conversa, brownie é o assunto inteiro. */
const sabor = (nome: string) => nome.replace(/^brownies?\s+/i, '').trim();

const listaDeSabores = (itens: ItemDeSabor[]) =>
  itens
    .filter((i) => i.quantidade > 0)
    .map((i) => `${i.quantidade} ${sabor(i.produto)}`)
    .join('\n');

/** Escolhe uma das formas de dizer. Sempre a mesma para o mesmo número. */
const pegar = <T,>(opcoes: T[], variante: number): T =>
  opcoes[((variante % opcoes.length) + opcoes.length) % opcoes.length];

const primeiroNome = (nome?: string | null) => (nome ? nome.trim().split(' ')[0] : null);

const SAUDACOES_COM_NOME = [
  (n: string) => `Oi, ${n}, tudo bem?`,
  (n: string) => `Oi, ${n}, tudo certo?`,
  (n: string) => `Olá, ${n}, tudo bem por aí?`,
  (n: string) => `Oi, ${n}, como você está?`,
  (n: string) => `Oi, ${n}, tudo tranquilo?`,
];

const SAUDACOES_SEM_NOME = [
  'Oi, tudo bem?',
  'Oi, tudo certo?',
  'Olá, tudo bem por aí?',
  'Oi, como vocês estão?',
];

const saudacao = (nome: string | null | undefined, variante: number) => {
  const primeiro = primeiroNome(nome);
  return primeiro
    ? pegar(SAUDACOES_COM_NOME, variante)(primeiro)
    : pegar(SAUDACOES_SEM_NOME, variante);
};

/** 1. Confirmar a próxima reposição. */
export function confirmarProximoPedido(
  dados: { contato?: string | null; data: string; quantidade: number; itens?: ItemDeSabor[] },
  variante = 0
): string {
  const aberturas = [
    (d: string, q: number) => `Sua próxima reposição está marcada pra ${d}, com ${q} brownies`,
    (d: string, q: number) => `Passando pra combinar a reposição de ${d}, seriam ${q} brownies`,
    (d: string, q: number) => `Tem uma entrega sua prevista pra ${d}, com ${q} brownies`,
    (d: string, q: number) => `Sua reposição de ${d} está na agenda, com ${q} brownies`,
  ];

  const fechos = ['Posso confirmar?', 'Posso manter assim?', 'Confirma pra mim?', 'Está de pé?'];

  const linhas = [
    saudacao(dados.contato, variante),
    '',
    pegar(aberturas, variante)(comoData(dados.data), dados.quantidade),
  ];

  const sabores = listaDeSabores(dados.itens || []);
  if (sabores) linhas.push('', sabores);

  linhas.push('', pegar(fechos, variante));
  return linhas.join('\n');
}

/** 2. Lembrete de pagamento. Usa a forma de pagamento do título, não "boleto". */
export function lembreteDePagamento(
  dados: {
    contato?: string | null;
    titulos: { valor: number; dataVencimento: string; formaPagamento?: string; diasAtraso: number }[];
  },
  variante = 0
): string {
  if (!dados.titulos.length) {
    return [
      saudacao(dados.contato, variante),
      '',
      pegar(
        ['Está tudo em dia por aqui, obrigado', 'Por aqui não tem nada em aberto, obrigado'],
        variante
      ),
    ].join('\n');
  }

  const total = dados.titulos.reduce((s, t) => s + t.valor, 0);
  const formas = [...new Set(dados.titulos.map((t) => t.formaPagamento).filter(Boolean))];
  const venceu = dados.titulos.some((t) => t.diasAtraso > 2);

  const aberturasVencidas = [
    'Passando pra lembrar de um pagamento que ficou em aberto aqui',
    'Vim lembrar de um pagamento que está em aberto por aqui',
    'Passando rapidinho por causa de um pagamento em aberto',
  ];

  const aberturasAVencer = [
    'Passando pra lembrar do pagamento',
    'Só passando pra lembrar do pagamento que está chegando',
    'Lembrete rápido do pagamento',
  ];

  const fechos = [
    'Se já pagou, é só desconsiderar',
    'Se o pagamento já saiu, pode ignorar',
    'Se já estiver pago, desconsidera',
  ];

  const linhas = [
    saudacao(dados.contato, variante),
    '',
    pegar(venceu ? aberturasVencidas : aberturasAVencer, variante),
    '',
    ...dados.titulos.map(
      (t) =>
        `${dinheiro(t.valor)}, ${t.diasAtraso > 2 ? 'venceu' : 'vence'} em ${soData(t.dataVencimento)}`
    ),
  ];

  if (dados.titulos.length > 1) linhas.push('', `Total: ${dinheiro(total)}`);
  if (formas.length === 1) linhas.push('', `Pode ser por ${formas[0]!.toLowerCase()}`);

  linhas.push('', pegar(fechos, variante));
  return linhas.join('\n');
}

/**
 * 3. Resumo dos últimos pedidos.
 *
 * Sem cumprimento: quem manda isso está no meio de uma conversa já em
 * andamento, respondendo "quanto eu peguei da última vez?". Um "oi, tudo bem?"
 * no meio do papo soa de robô.
 *
 * O formato é de lista, não de texto corrido: data e total em negrito, sabores
 * na linha de baixo, ordenados do que mais saiu para o que menos. O negrito do
 * WhatsApp é o asterisco.
 */
export function resumoUltimosPedidos(
  dados: {
    contato?: string | null;
    entregas: { data: string; quantidade: number | null; itens: ItemDeSabor[] }[];
  },
  variante = 0
): string {
  if (!dados.entregas.length) return 'Não encontrei entregas registradas ainda';

  const quantos = dados.entregas.length;

  const titulos = [
    quantos === 1 ? '*Seu último pedido*' : `*Seus últimos ${quantos} pedidos*`,
    quantos === 1 ? '*O último pedido de vocês*' : `*Os últimos ${quantos} pedidos de vocês*`,
  ];

  const blocos = dados.entregas.map((e) => {
    const sabores = [...e.itens]
      .filter((i) => i.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade)
      .map((i) => `${i.quantidade} ${sabor(i.produto)}`)
      .join(', ');

    return `*${soData(e.data)}* · ${e.quantidade ?? 0} un${sabores ? `\n${sabores}` : ''}`;
  });

  // Linha em branco entre um pedido e outro: é o que separa os blocos no
  // WhatsApp e tira o ar de texto corrido.
  return [pegar(titulos, variante), '', blocos.join('\n\n')].join('\n');
}

/** 4. Sugestão de reposição: repetir o pedido anterior. */
export function sugestaoIgualUltimoPedido(
  dados: {
    contato?: string | null;
    ultimaEntrega: { data: string; quantidade: number | null; itens: ItemDeSabor[] };
  },
  variante = 0
): string {
  const { ultimaEntrega } = dados;
  const quantidade = ultimaEntrega.quantidade ?? 0;
  const data = soData(ultimaEntrega.data);

  const aberturas = [
    `Quer repetir o pedido de ${data}? Foram ${quantidade} brownies`,
    `Posso mandar igual ao de ${data}, com ${quantidade} brownies?`,
    `Seu último pedido, de ${data}, teve ${quantidade} brownies. Repito do mesmo jeito?`,
    `Dá pra repetir o de ${data}, que foi de ${quantidade} brownies`,
  ];

  const fechos = [
    'Se quiser mudar alguma coisa é só falar',
    'Se preferir mexer no mix, me diz',
    'Qualquer ajuste eu faço por aqui',
  ];

  const linhas = [saudacao(dados.contato, variante), '', pegar(aberturas, variante)];

  const sabores = listaDeSabores(ultimaEntrega.itens);
  if (sabores) linhas.push('', sabores);

  linhas.push('', pegar(fechos, variante));
  return linhas.join('\n');
}

/** 5. Troca ou bonificação pendente. */
export function avisoTrocasBonificacoes(
  dados: { contato?: string | null; trocas: ItemDeSabor[]; bonificacoes: ItemDeSabor[] },
  variante = 0
): string {
  const aberturas = [
    'Ficou anotado pra próxima entrega',
    'Só confirmando o que está anotado pra próxima entrega',
    'Na próxima entrega a gente leva isto aqui',
  ];

  const fechos = [
    'Qualquer coisa me avisa',
    'Se faltar alguma coisa, me fala',
    'Qualquer dúvida estou por aqui',
  ];

  const linhas = [saudacao(dados.contato, variante), '', pegar(aberturas, variante), ''];

  for (const t of dados.trocas) linhas.push(`Troca: ${t.quantidade} ${sabor(t.produto)}`);
  for (const b of dados.bonificacoes) linhas.push(`Bonificação: ${b.quantidade} ${sabor(b.produto)}`);

  linhas.push('', pegar(fechos, variante));
  return linhas.join('\n');
}

/**
 * 6. Tabela de preço, para quem está chegando.
 *
 * Cada número aqui vem de `config/comercial.ts`, que é o espelho do
 * `contexto/prospeccao.md`. Nada escrito à mão neste texto.
 */
export function tabelaDePrecos(dados: { ambulante?: boolean } = {}, variante = 0): string {
  const faixa = dados.ambulante ? PRECOS.ambulante : PRECOS.pontoDeVenda;

  const aberturas = [
    'Oi, tudo bem? Que bom que você se interessou pelos nossos brownies',
    'Oi, tudo certo? Obrigado pelo interesse nos nossos brownies',
    'Olá, tudo bem? Fico feliz que você tenha procurado a gente',
  ];

  const fechos = [
    'Quer que eu monte um primeiro pedido?',
    'Posso montar um primeiro pedido pra vocês?',
    'Se quiser, já deixo um primeiro pedido separado',
  ];

  const linhas = [
    pegar(aberturas, variante),
    '',
    `São brownies artesanais, feitos com chocolate ${PRODUTO.cacau}, sem achocolatado, e com validade de ${PRODUTO.validadeDias} dias`,
    '',
    `Sabores: ${SABORES.join(', ')}`,
    '',
    `Valor: ${dinheiro(faixa.valorUnitario)} a unidade`,
    `Pedido mínimo: ${PEDIDO_MINIMO.unidades} unidades, em múltiplos de ${PEDIDO_MINIMO.multiploDe}`,
    `Entregas em ${ENTREGA.cidade}, ${ENTREGA.dias.join(' e ')}${ENTREGA.freteGratis ? ', com frete grátis' : ''}`,
  ];

  if (faixa.pagamentoAntecipado) {
    linhas.push('Pagamento à vista');
  } else {
    linhas.push(
      `Os ${PAGAMENTO.pedidosAntecipadosIniciais} primeiros pedidos são à vista, e depois disso dá pra fechar no boleto de ${PAGAMENTO.boletoDiasApos} dias`
    );
  }

  if (faixa.temTroca) {
    linhas.push(
      '',
      `Trocamos sem custo qualquer ${TROCA.vale}, e o expositor ${EXPOSITOR.semCusto ? 'fica por nossa conta' : 'é cobrado à parte'}`
    );
  }

  linhas.push('', pegar(fechos, variante));
  return linhas.join('\n');
}
