/**
 * O ÚNICO arquivo que conhece o HTML do WhatsApp Web.
 *
 * O WhatsApp muda o site sem avisar e as classes do CSS são embaralhadas a cada
 * versão. Por isso tudo o que depende da tela dele está aqui, nos SELETORES
 * abaixo: quando quebrar, é este arquivo que se conserta, e só ele.
 *
 * Duas coisas que o painel precisa:
 *   1. de quem é a conversa aberta
 *   2. escrever um texto na caixa de digitação — sem enviar
 *
 * Nada aqui injeta código dentro do site. A gente só lê a tela, como um leitor
 * de página faria.
 *
 * Última conferência dos seletores: 17/09/2026.
 */

export const SELETORES = {
  /** A raiz do WhatsApp. É ela que a gente observa para saber que algo mudou. */
  app: '#app',
  /** O painel da conversa aberta. Não existe enquanto nenhuma está aberta. */
  conversa: '#main',
  /** O cabeçalho da conversa: nome (ou número) de quem está do outro lado. */
  cabecalho: '#main header',
  /** O nome aparece como atributo title, porque pode estar cortado na tela. */
  tituloDoCabecalho: '#main header span[title]',
  /** Cada mensagem carrega o identificador de quem enviou. */
  mensagemComId: '#main [data-id]',
  /** A caixa de digitação. É um editor, não um input comum. */
  caixaDeTexto: '#main footer [contenteditable="true"]',
} as const;

export interface ChatAberto {
  /** Muda quando a conversa muda. É o que o painel usa para se atualizar. */
  chaveChat: string;
  /** Nome salvo, nome do perfil ou o número — o que estiver no cabeçalho. */
  titulo: string | null;
  /** Só dígitos, com o país. Nulo quando o WhatsApp não mostra o número. */
  telefone: string | null;
  /** Identificador interno, estável por conta. Nulo quando não aparece. */
  lid: string | null;
}

/**
 * O identificador de uma mensagem vem assim:
 *   false_5551999999999@c.us_3EB0...      (número de verdade)
 *   false_123456789@lid_3EB0...           (identificador anônimo)
 *
 * Desde o fim de 2025 o segundo formato é cada vez mais comum: o WhatsApp
 * passou a esconder o número. Por isso o painel também guarda o `lid`.
 */
const TELEFONE_NO_ATRIBUTO = /(\d{10,15})@(?:c\.us|s\.whatsapp\.net)/;
const LID_NO_ATRIBUTO = /(\d{5,})@lid/;

/**
 * Procura o telefone (ou o identificador anônimo) em qualquer atributo da tela.
 *
 * Antes isso vinha fácil, no identificador de cada mensagem. Desde o fim de
 * 2025 o WhatsApp deixou de colocar o número ali, então a busca é ampla de
 * propósito — e, quando não acha nada, tudo bem: quem resolve é o vínculo
 * manual, feito uma vez por conversa.
 */
function lerIdentificadores(raiz: ParentNode): { telefone: string | null; lid: string | null } {
  const dentro = Array.from(raiz.querySelectorAll<HTMLElement>('[data-id], [data-jid], [id]'));
  const nos = dentro.length
    ? dentro
    : Array.from(document.querySelectorAll<HTMLElement>('[data-id], [data-jid], [id]'));

  let telefone: string | null = null;
  let lid: string | null = null;

  for (const no of nos) {
    for (const atributo of Array.from(no.attributes)) {
      const valor = atributo.value;
      if (!valor.includes('@')) continue;

      if (!telefone) {
        const m = valor.match(TELEFONE_NO_ATRIBUTO);
        if (m) telefone = m[1];
      }
      if (!lid) {
        const m = valor.match(LID_NO_ATRIBUTO);
        if (m) lid = m[1];
      }
    }
    if (telefone && lid) break;
  }

  return { telefone, lid };
}

/** O primeiro identificador de mensagem — serve para saber que a conversa mudou. */
function primeiroIdDeMensagem(raiz: ParentNode): string | null {
  const no = raiz.querySelector<HTMLElement>('[data-id]') || document.querySelector('[data-id]');
  return no?.getAttribute('data-id') || null;
}

/** Contato não salvo costuma aparecer com o número no lugar do nome. */
function telefoneNoTitulo(titulo: string | null): string | null {
  if (!titulo) return null;
  if (!/^\+?[\d\s()\-.]{10,}$/.test(titulo.trim())) return null;

  const digitos = titulo.replace(/\D/g, '');
  return digitos.length >= 10 ? digitos : null;
}

/**
 * O painel da conversa aberta.
 *
 * O WhatsApp já mudou o nome dessa caixa mais de uma vez, então em vez de um
 * endereço só a gente tenta vários, do mais específico para o mais genérico. O
 * último critério é o mais confiável de todos: se existe caixa de digitação na
 * tela, existe conversa aberta.
 */
function raizDaConversa(): ParentNode | null {
  const tentativas = [SELETORES.conversa, 'div[role="application"]', 'main'];

  for (const seletor of tentativas) {
    const achado = document.querySelector(seletor);
    if (achado) return achado;
  }

  const caixa = document.querySelector('[contenteditable="true"][role="textbox"]');
  return caixa ? document.body : null;
}

/**
 * Legendas de botão do WhatsApp que aparecem como `title` no cabeçalho e não
 * têm nada a ver com o nome de quem está do outro lado.
 */
const LEGENDAS_DE_BOTAO = [
  'dados do perfil',
  'dados do contato',
  'dados do grupo',
  'menu',
  'pesquisar',
  'buscar',
  'chamada',
  'anexar',
  'perfil',
];

const ehLegendaDeBotao = (texto: string) =>
  LEGENDAS_DE_BOTAO.some((l) => texto.toLowerCase().includes(l));

/**
 * O nome (ou número) de quem está do outro lado.
 *
 * A primeira linha do texto do cabeçalho é a fonte boa: é ali que o WhatsApp
 * escreve o nome salvo, o nome do perfil ou o número. O atributo `title` só
 * entra como reserva, e ainda assim descartando legenda de botão — foi o que
 * fez o painel mostrar "Dados do perfil" no lugar do cliente.
 */
function lerTitulo(): string | null {
  const cabecalho =
    document.querySelector<HTMLElement>(SELETORES.cabecalho) ||
    document.querySelector<HTMLElement>('header');
  if (!cabecalho) return null;

  const primeiraLinha = cabecalho.innerText
    ?.split('\n')
    .map((l) => l.trim())
    .find((l) => l && !ehLegendaDeBotao(l));
  if (primeiraLinha) return primeiraLinha;

  const titulos = Array.from(cabecalho.querySelectorAll<HTMLElement>('[title]'))
    .map((n) => n.getAttribute('title')?.trim() || '')
    .filter((t) => t && !ehLegendaDeBotao(t));

  return titulos[0] || null;
}

export function lerChatAberto(): ChatAberto | null {
  const conversa = raizDaConversa();
  if (!conversa) return null;

  const titulo = lerTitulo();

  const { telefone, lid } = lerIdentificadores(conversa);
  const telefoneFinal = telefone || telefoneNoTitulo(titulo);

  // A chave serve para o painel saber que a conversa mudou. Ela precisa ser
  // estável enquanto a conversa é a mesma: por isso o identificador da primeira
  // mensagem só entra quando não há nome, telefone nem lid — ele muda sozinho a
  // cada mensagem nova ou rolagem da tela, e faria o painel recarregar à toa.
  const chaveChat =
    telefoneFinal || lid || titulo || primeiroIdDeMensagem(conversa) || 'conversa';

  return { chaveChat, titulo, telefone: telefoneFinal, lid };
}

/**
 * Avisa quando a conversa aberta muda.
 *
 * A URL do WhatsApp não muda ao trocar de conversa, então não dá para escutar
 * navegação: o jeito é observar a tela. Ela muda o tempo todo (mensagem nova,
 * "digitando…", horário), por isso o aviso só sai quando a chave muda de fato,
 * e com uma pausa para não disparar a cada piscada.
 */
export function observarTrocaDeChat(
  aoMudar: (chat: ChatAberto | null) => void,
  esperaMs = 250
): () => void {
  let ultimaChave: string | null = null;
  let timer: number | undefined;

  const conferir = () => {
    const chat = lerChatAberto();
    const chave = chat?.chaveChat ?? null;
    if (chave === ultimaChave) return;
    ultimaChave = chave;
    aoMudar(chat);
  };

  const observer = new MutationObserver(() => {
    window.clearTimeout(timer);
    timer = window.setTimeout(conferir, esperaMs);
  });

  const alvo = document.querySelector(SELETORES.app) || document.body;
  observer.observe(alvo, { childList: true, subtree: true });

  conferir();

  return () => {
    window.clearTimeout(timer);
    observer.disconnect();
  };
}

function porCursorNoFim(caixa: HTMLElement) {
  caixa.focus();
  const range = document.createRange();
  range.selectNodeContents(caixa);
  range.collapse(false);

  const selecao = window.getSelection();
  selecao?.removeAllRanges();
  selecao?.addRange(range);
}

/**
 * Escreve o texto na caixa de digitação. **Não envia.**
 *
 * A caixa é um editor moderno que ignora quem simplesmente troca o conteúdo por
 * fora: ele precisa achar que a pessoa colou. Por isso a gente finge uma colagem
 * de verdade. Se mesmo assim não entrar, tenta o caminho antigo (insertText).
 *
 * Em nenhuma hipótese esta função dispara Enter ou clica no botão de enviar.
 */
/**
 * A caixa de digitação da mensagem.
 *
 * Cuidado: a busca de conversas também é um campo editável. Por isso a gente
 * procura primeiro dentro do rodapé da conversa, e só depois relaxa — pegando,
 * nesse caso, o último campo editável da tela, que é o da mensagem.
 */
function acharCaixaDeTexto(): HTMLElement | null {
  const tentativas = [
    SELETORES.caixaDeTexto,
    'footer [contenteditable="true"]',
    '#main [contenteditable="true"]',
  ];

  for (const seletor of tentativas) {
    const achado = document.querySelector<HTMLElement>(seletor);
    if (achado) return achado;
  }

  const editaveis = document.querySelectorAll<HTMLElement>('[contenteditable="true"]');
  return editaveis.length ? editaveis[editaveis.length - 1] : null;
}

export function inserirTexto(texto: string): boolean {
  const caixa = acharCaixaDeTexto();
  if (!caixa) return false;

  porCursorNoFim(caixa);

  const antes = caixa.textContent || '';

  try {
    const dados = new DataTransfer();
    dados.setData('text/plain', texto);
    const evento = new ClipboardEvent('paste', {
      clipboardData: dados,
      bubbles: true,
      cancelable: true,
    });

    // Quando o editor assume a colagem, ele cancela o evento — e é esse
    // cancelamento que diz que deu certo. Conferir o texto na hora não serve:
    // o editor atualiza a tela um instante depois, e a gente escreveria duas
    // vezes achando que a primeira falhou.
    const seguiuAdiante = caixa.dispatchEvent(evento);
    if (!seguiuAdiante) return true;
  } catch {
    // Alguns navegadores não deixam montar o evento de colagem: cai no plano B.
  }

  if ((caixa.textContent || '') !== antes) return true;

  porCursorNoFim(caixa);
  document.execCommand('insertText', false, texto);

  return (caixa.textContent || '') !== antes;
}

/**
 * Fotografia do que existe na tela agora, para consertar os seletores quando o
 * WhatsApp mudar o site. Não é usada no dia a dia: é o que o painel mostra no
 * botão de diagnóstico, para o Lucca copiar e mandar.
 */
export function diagnostico(): Record<string, unknown> {
  const conta = (seletor: string) => document.querySelectorAll(seletor).length;

  const cabecalho = document.querySelector<HTMLElement>(SELETORES.cabecalho);
  const primeirosIds = Array.from(document.querySelectorAll<HTMLElement>('[data-id]'))
    .slice(0, 3)
    .map((n) => n.getAttribute('data-id'));

  const titulosNoCabecalho = cabecalho
    ? Array.from(cabecalho.querySelectorAll<HTMLElement>('[title]'))
        .slice(0, 5)
        .map((n) => `${n.tagName.toLowerCase()}[title="${n.getAttribute('title')}"]`)
    : [];

  return {
    achou: {
      app: conta(SELETORES.app),
      conversa: conta(SELETORES.conversa),
      cabecalho: conta(SELETORES.cabecalho),
      tituloDoCabecalho: conta(SELETORES.tituloDoCabecalho),
      mensagemComId: conta(SELETORES.mensagemComId),
      caixaDeTexto: conta(SELETORES.caixaDeTexto),
    },
    dataIdNaPaginaInteira: conta('[data-id]'),
    editaveisNaPagina: conta('[contenteditable="true"]'),
    achouRaizDaConversa: !!raizDaConversa(),
    achouCaixaDeTexto: !!acharCaixaDeTexto(),
    primeirosIds,
    titulosNoCabecalho,
    // Sobrou algum atributo com "@" na tela? É onde o telefone costumava estar.
    atributosComArroba: Array.from(document.querySelectorAll<HTMLElement>('[data-id], [data-jid], [id]'))
      .flatMap((n) => Array.from(n.attributes).map((a) => `${a.name}="${a.value}"`))
      .filter((t) => t.includes('@'))
      .slice(0, 5),
    textoDoCabecalho: cabecalho?.innerText?.slice(0, 120) ?? null,
    lidoAgora: lerChatAberto(),
  };
}
