/**
 * O Supabase visto de dentro da extensão.
 *
 * É o mesmo projeto do Mischa OS, com a mesma chave pública — quem manda no que
 * pode ser lido é o login e as regras do banco, não esta chave.
 *
 * A diferença está em onde a sessão é guardada: a extensão não tem o
 * armazenamento do site, então usa o do navegador (`chrome.storage.local`). É o
 * que faz o painel continuar logado depois de fechar o Brave.
 *
 * O build da extensão troca `@/integrations/supabase/client` por este arquivo,
 * então qualquer código compartilhado do app funciona aqui sem alteração.
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://ttguzgouurqopeccvzve.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Z3V6Z291dXJxb3BlY2N2enZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDI1NzEsImV4cCI6MjA2Mzc3ODU3MX0.JrJbtkh8MUA5DA5v2MSPHfb2pRaz08fU-HibNYVTHwE';

const armazenamentoDoNavegador = {
  async getItem(chave: string) {
    const guardado = await chrome.storage.local.get(chave);
    return (guardado?.[chave] as string) ?? null;
  },
  async setItem(chave: string, valor: string) {
    await chrome.storage.local.set({ [chave]: valor });
  },
  async removeItem(chave: string) {
    await chrome.storage.local.remove(chave);
  },
};

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: armazenamentoDoNavegador,
    persistSession: true,
    autoRefreshToken: true,
    // Não existe URL de retorno num painel de extensão.
    detectSessionInUrl: false,
  },
});
