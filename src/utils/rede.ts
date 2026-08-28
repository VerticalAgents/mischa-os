/**
 * Detecção de queda de internet, num lugar só.
 *
 * Quando a requisição não sai, o navegador rejeita com "Failed to fetch" — e
 * como o app mostra `error.message` direto em dezenas de toasts, era isso que
 * aparecia para o usuário. Em vez de traduzir a mensagem em cada um desses
 * lugares (e esquecer os próximos), a troca é feita na origem: o `fetch` do
 * navegador é envolvido uma vez, e toda falha de rede passa a rejeitar com uma
 * mensagem em português.
 *
 * De quebra, é o mesmo ponto que sabe dizer se a conexão está de pé — o que
 * alimenta o aviso permanente na tela. `navigator.onLine` sozinho não serve:
 * ele diz que existe uma rede, não que ela funciona (Wi-Fi conectado sem
 * internet continua reportando "online").
 */

export const MENSAGEM_SEM_CONEXAO =
  "Sem internet. Verifique sua rede e tente de novo.";

/** Erro de rede já traduzido. Mantém o original em `causa` para depuração. */
export class ErroDeRede extends Error {
  readonly causa: unknown;
  constructor(causa: unknown) {
    super(MENSAGEM_SEM_CONEXAO);
    // O cliente do Supabase embrulha o erro como "Nome: mensagem". O nome é
    // escolhido para que as duas formas leiam bem: sozinha, a mensagem já é
    // uma frase; com o prefixo, vira "Conexão: Sem internet...".
    this.name = "Conexão";
    this.causa = causa;
  }
}

/**
 * É falha de rede, e não outra coisa?
 *
 * Requisição cancelada (troca de tela, filtro digitado rápido) chega aqui como
 * AbortError e NÃO é queda de internet — tratá-la como tal acenderia o aviso à
 * toa. O que sobra de `fetch` é o TypeError, que é a falha de rede de verdade.
 */
export const ehFalhaDeRede = (e: unknown): boolean => {
  if (e instanceof ErroDeRede) return true;
  if (e instanceof DOMException && e.name === "AbortError") return false;
  if (e instanceof TypeError) return true;
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return /failed to fetch|networkerror|load failed|network request failed/i.test(msg);
};

type Ouvinte = (semConexao: boolean) => void;

const ouvintes = new Set<Ouvinte>();
let falhaRecente = false;

const semConexaoAgora = () =>
  falhaRecente || (typeof navigator !== "undefined" && navigator.onLine === false);

const avisar = () => {
  const estado = semConexaoAgora();
  ouvintes.forEach((f) => f(estado));
};

const marcarFalha = () => {
  if (falhaRecente) return;
  falhaRecente = true;
  avisar();
};

/** Qualquer resposta que volte do servidor prova que a rede está de pé. */
const marcarSucesso = () => {
  if (!falhaRecente) return;
  falhaRecente = false;
  avisar();
};

export const assinarEstadoDaRede = (ouvinte: Ouvinte): (() => void) => {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
};

export const estaSemConexao = (): boolean => semConexaoAgora();

let instalado = false;

/**
 * Envolve o `fetch` global. Chamado uma vez, na subida do app.
 *
 * O Supabase (banco, auth e edge functions) usa `fetch` por baixo, então
 * envolver aqui cobre praticamente todas as chamadas do app de uma vez.
 */
export function instalarDeteccaoDeRede(): void {
  if (instalado || typeof window === "undefined") return;
  instalado = true;

  const fetchOriginal = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    try {
      const resposta = await fetchOriginal(...args);
      marcarSucesso();
      return resposta;
    } catch (e) {
      if (ehFalhaDeRede(e)) {
        marcarFalha();
        throw new ErroDeRede(e);
      }
      throw e;
    }
  };

  window.addEventListener("offline", avisar);
  window.addEventListener("online", () => {
    // O sistema diz que voltou; a próxima resposta bem-sucedida confirma.
    falhaRecente = false;
    avisar();
  });
}

// Instala no carregamento do módulo, e não numa chamada dentro do `main`.
// Os imports de um módulo ES são avaliados ANTES do corpo dele: se a instalação
// dependesse de uma chamada em `main.tsx`, o cliente do Supabase já teria sido
// criado — e ele guarda a referência do `fetch` no momento em que nasce.
// Por isso este import precisa vir antes do import do App.
instalarDeteccaoDeRede();
