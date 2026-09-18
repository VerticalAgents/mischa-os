/**
 * Content script: roda dentro da aba do WhatsApp.
 *
 * Faz só o intermédio entre a tela do WhatsApp e o painel. Não sabe nada de
 * cliente, de Supabase ou de regra de negócio — e não pode saber: daqui, uma
 * chamada ao Supabase seria bloqueada pelo navegador.
 */
import {
  lerChatAberto,
  observarTrocaDeChat,
  inserirTexto,
  buscarConversa,
  diagnostico,
} from './whatsapp-dom';
import type { RecadoParaAba, RecadoParaPainel } from '../lib/mensagens-runtime';

function iniciar() {
  observarTrocaDeChat((chat) => {
    const recado: RecadoParaPainel = { tipo: 'CHAT_MUDOU', chat };
    // Se o painel estiver fechado, ninguém escuta — e tudo bem.
    chrome.runtime.sendMessage(recado).catch(() => {});
  });

  chrome.runtime.onMessage.addListener((recado: RecadoParaAba, _origem, responder) => {
    if (recado?.tipo === 'LER_CHAT') {
      responder({ ok: true, chat: lerChatAberto() });
      return true;
    }

    if (recado?.tipo === 'DIAGNOSTICO') {
      responder({ ok: true, dados: diagnostico() });
      return true;
    }

    if (recado?.tipo === 'BUSCAR_CONVERSA') {
      responder({ ok: buscarConversa(recado.texto) });
      return true;
    }

    if (recado?.tipo === 'INSERIR_TEXTO') {
      responder({ ok: inserirTexto(recado.texto) });
      return true;
    }

    return false;
  });
}

// O service worker injeta este arquivo de novo quando a extensão é recarregada,
// para não obrigar a dar F5 na aba. Injetar duas vezes não pode duplicar nada,
// por isso a marca.
const MARCA = '__mischaWhatsAppAtivo';
const janela = window as unknown as Record<string, boolean>;

if (!janela[MARCA]) {
  janela[MARCA] = true;
  iniciar();
}
