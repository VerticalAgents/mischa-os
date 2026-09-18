/**
 * Mantém o painel sabendo qual conversa está aberta na aba do WhatsApp.
 *
 * Duas fontes: o content script avisa quando a conversa muda, e ao abrir o
 * painel a gente pergunta uma vez (senão ficaria em branco até o Lucca trocar
 * de conversa).
 */
import { useEffect, useState } from 'react';
import type { ChatAberto } from '@ext/content/whatsapp-dom';
import type { RecadoParaAba, RecadoParaPainel } from '@ext/lib/mensagens-runtime';
import { normalizarTelefoneBR } from '@/utils/telefone';

const WHATSAPP = 'https://web.whatsapp.com';

export type EstadoDaAba = 'carregando' | 'sem-whatsapp' | 'sem-conversa' | 'com-conversa';

async function abaDoWhatsApp() {
  const [ativa] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (ativa?.url?.startsWith(WHATSAPP)) return ativa;

  // O painel pode estar aberto com outra aba em foco. Se existe uma do WhatsApp
  // na janela, é dela que a gente fala.
  const [outra] = await chrome.tabs.query({ url: `${WHATSAPP}/*`, currentWindow: true });
  return outra ?? null;
}

/**
 * Fala com o código da extensão que roda dentro da aba.
 *
 * Quando a extensão é recarregada, as abas já abertas ficam sem esse código e a
 * conversa dá "não tem ninguém do outro lado". Em vez de exigir F5, a gente
 * pede ao porteiro para injetar de novo e tenta mais uma vez.
 */
async function falarComAba<T>(tabId: number, recado: RecadoParaAba): Promise<T | null> {
  const tentar = () => chrome.tabs.sendMessage(tabId, recado).catch(() => null);

  const primeira = await tentar();
  if (primeira) return primeira as T;

  await chrome.runtime.sendMessage({ tipo: 'GARANTIR_CODIGO', tabId }).catch(() => {});
  return (await tentar()) as T | null;
}

export function useChatAberto() {
  const [chat, setChat] = useState<ChatAberto | null>(null);
  const [estado, setEstado] = useState<EstadoDaAba>('carregando');

  useEffect(() => {
    let vivo = true;

    const perguntar = async () => {
      const aba = await abaDoWhatsApp();
      if (!vivo) return;

      if (!aba?.id) {
        setEstado('sem-whatsapp');
        setChat(null);
        return;
      }

      const resposta = await falarComAba<{ chat?: ChatAberto | null }>(aba.id, {
        tipo: 'LER_CHAT',
      });
      if (!vivo) return;

      const aberto = (resposta as { chat?: ChatAberto | null })?.chat ?? null;
      setChat(aberto);
      setEstado(aberto ? 'com-conversa' : 'sem-conversa');
    };

    const ouvir = (recado: RecadoParaPainel) => {
      if (recado?.tipo !== 'CHAT_MUDOU') return;
      setChat(recado.chat);
      setEstado(recado.chat ? 'com-conversa' : 'sem-conversa');
    };

    chrome.runtime.onMessage.addListener(ouvir);
    chrome.tabs.onActivated.addListener(perguntar);
    perguntar();

    return () => {
      vivo = false;
      chrome.runtime.onMessage.removeListener(ouvir);
      chrome.tabs.onActivated.removeListener(perguntar);
    };
  }, []);

  return { chat, estado };
}

/** Fotografia da tela do WhatsApp, para consertar os seletores quando quebram. */
export async function pedirDiagnostico(): Promise<unknown> {
  const aba = await abaDoWhatsApp();
  if (!aba?.id) return { erro: 'nenhuma aba do WhatsApp aberta' };

  const resposta = await falarComAba<{ dados?: unknown }>(aba.id, { tipo: 'DIAGNOSTICO' });
  return resposta?.dados ?? { erro: 'a aba do WhatsApp não respondeu; tente dar F5 nela' };
}

/** Escreve o texto na caixa de digitação da conversa aberta. Não envia. */
export async function inserirNaCaixa(texto: string): Promise<boolean> {
  const aba = await abaDoWhatsApp();
  if (!aba?.id) return false;

  const resposta = await falarComAba<{ ok?: boolean }>(aba.id, { tipo: 'INSERIR_TEXTO', texto });
  return !!resposta?.ok;
}

/**
 * Abre a conversa de um cliente.
 *
 * Com telefone, o WhatsApp abre a conversa direto. Sem telefone — que é o caso
 * da maioria dos clientes — o painel escreve o nome na busca e quem escolhe o
 * resultado é o Lucca.
 */
export async function abrirConversa(params: {
  telefone: string | null;
  nome: string;
}): Promise<'abriu' | 'buscou' | 'nao-consegui'> {
  const aba = await abaDoWhatsApp();
  if (!aba?.id) return 'nao-consegui';

  const digitos = normalizarTelefoneBR(params.telefone).digitos;

  if (digitos) {
    await chrome.tabs.update(aba.id, { url: `${WHATSAPP}/send?phone=${digitos}`, active: true });
    return 'abriu';
  }

  await chrome.tabs.update(aba.id, { active: true });
  const resposta = await falarComAba<{ ok?: boolean }>(aba.id, {
    tipo: 'BUSCAR_CONVERSA',
    texto: params.nome,
  });

  return resposta?.ok ? 'buscou' : 'nao-consegui';
}
