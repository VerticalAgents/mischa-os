/**
 * Os recados que as três peças da extensão trocam entre si.
 *
 * Fica num arquivo só para o painel e o content script não inventarem nomes
 * diferentes para a mesma coisa.
 */
import type { ChatAberto } from '@ext/content/whatsapp-dom';

export type RecadoParaPainel = {
  tipo: 'CHAT_MUDOU';
  chat: ChatAberto | null;
};

export type RecadoParaAba =
  | { tipo: 'LER_CHAT' }
  | { tipo: 'DIAGNOSTICO' }
  | { tipo: 'INSERIR_TEXTO'; texto: string };

export type RespostaDaAba =
  | { ok: true; chat: ChatAberto | null }
  | { ok: boolean };
