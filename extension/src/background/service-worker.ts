/**
 * Service worker: o porteiro da extensão.
 *
 * Faz três coisas — deixa o painel disponível **só** nas abas do WhatsApp, abre
 * ele quando se clica no ícone, e garante que o código da extensão está rodando
 * dentro da aba. Não guarda estado nem fala com o Supabase, porque o navegador
 * desliga este processo depois de alguns segundos parado.
 */
const WHATSAPP = 'https://web.whatsapp.com';
const CAMINHO_DO_PAINEL = 'src/panel/index.html';

export const ehWhatsApp = (url?: string) => !!url?.startsWith(WHATSAPP);

/**
 * Por padrão o painel fica desligado: em aba que não é do WhatsApp ele não deve
 * nem existir. Cada aba do WhatsApp liga o seu.
 */
async function desligarPorPadrao() {
  await chrome.sidePanel.setOptions({ path: CAMINHO_DO_PAINEL, enabled: false }).catch(() => {});
}

async function ajustarPainel(tabId: number, url?: string) {
  await chrome.sidePanel
    .setOptions({ tabId, path: CAMINHO_DO_PAINEL, enabled: ehWhatsApp(url) })
    .catch(() => {
      // Aba fechada no meio do caminho: não há o que ajustar.
    });
}

/**
 * Coloca o código da extensão dentro da aba, caso ainda não esteja lá.
 *
 * Acontece toda vez que a extensão é recarregada: as abas que já estavam
 * abertas ficam sem ele, e o painel não consegue falar com a página. Em vez de
 * exigir F5, a gente injeta de novo. Injetar duas vezes não faz mal: o próprio
 * arquivo avisa que já está rodando.
 */
async function garantirCodigoNaAba(tabId: number) {
  await chrome.scripting
    .executeScript({ target: { tabId }, files: ['content.js'] })
    .catch(() => {});
}

chrome.runtime.onInstalled.addListener(async () => {
  await desligarPorPadrao();

  // Abas do WhatsApp já abertas quando a extensão foi (re)carregada.
  const abas = await chrome.tabs.query({ url: `${WHATSAPP}/*` });
  for (const aba of abas) {
    if (aba.id === undefined) continue;
    await ajustarPainel(aba.id, aba.url);
    await garantirCodigoNaAba(aba.id);
  }
});

chrome.runtime.onStartup.addListener(desligarPorPadrao);

chrome.tabs.onUpdated.addListener(async (tabId, info, aba) => {
  if (!info.status && !info.url) return;
  await ajustarPainel(tabId, aba.url);
  if (info.status === 'complete' && ehWhatsApp(aba.url)) await garantirCodigoNaAba(tabId);
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  const aba = await chrome.tabs.get(tabId).catch(() => null);
  if (aba) await ajustarPainel(tabId, aba.url);
});

/**
 * Clique no ícone: abre o painel na aba do WhatsApp.
 *
 * Aqui não se usa `openPanelOnActionClick`, porque aquilo abriria o painel em
 * qualquer aba — justamente o que não se quer.
 */
chrome.action.onClicked.addListener(async (aba) => {
  if (aba.id === undefined) return;

  if (!ehWhatsApp(aba.url)) {
    await chrome.tabs.create({ url: WHATSAPP });
    return;
  }

  await ajustarPainel(aba.id, aba.url);
  await garantirCodigoNaAba(aba.id);
  await chrome.sidePanel.open({ tabId: aba.id }).catch(() => {});
});

/** O painel pede isto quando não consegue falar com a aba. */
chrome.runtime.onMessage.addListener((recado, _origem, responder) => {
  if (recado?.tipo !== 'GARANTIR_CODIGO' || typeof recado.tabId !== 'number') return false;

  garantirCodigoNaAba(recado.tabId).then(() => responder({ ok: true }));
  return true;
});
