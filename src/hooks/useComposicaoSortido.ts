import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ComposicaoSortido,
  MODULO_CONFIG_DISPLAYS,
  SORTIDO,
  composicaoOuPadrao,
  validarComposicao,
} from '@/utils/pedidoDisplays';

/**
 * O que vai dentro do display sortido, editável em Configurações › Proporções.
 * Mora em `configuracoes_sistema` (módulo `displays`) na linha do dono, que o
 * representante também lê. Sem linha salva, ou com uma torta, vale o `SORTIDO` do código.
 */
export function useComposicaoSortido() {
  const [composicao, setComposicao] = useState<ComposicaoSortido>(SORTIDO);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: ownerId } = await supabase.rpc('get_owner_id', { _user_id: user.id });
      const { data, error } = await supabase
        .from('configuracoes_sistema')
        .select('configuracoes')
        .eq('modulo', MODULO_CONFIG_DISPLAYS)
        .eq('user_id', ownerId || user.id)
        .maybeSingle();
      if (error) throw error;
      setComposicao(composicaoOuPadrao((data?.configuracoes as any)?.sortido));
    } catch (e) {
      console.warn('Composição do sortido não carregou, usando a padrão:', e);
      setComposicao(SORTIDO);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** Grava na linha de quem está logado (o dono). Devolve o erro, ou null. */
  const salvar = useCallback(async (nova: ComposicaoSortido): Promise<string | null> => {
    const validacao = validarComposicao(nova);
    if (!validacao.ok) return validacao.erro ?? 'Composição inválida.';
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'Usuário não autenticado.';
    const { data: existente, error: erroLeitura } = await supabase
      .from('configuracoes_sistema')
      .select('id, configuracoes')
      .eq('modulo', MODULO_CONFIG_DISPLAYS)
      .eq('user_id', user.id)
      .maybeSingle();
    if (erroLeitura) return erroLeitura.message;
    const configuracoes = { ...((existente?.configuracoes as any) || {}), sortido: nova };
    const { error } = existente
      ? await supabase.from('configuracoes_sistema').update({ configuracoes }).eq('id', existente.id)
      : await supabase
          .from('configuracoes_sistema')
          .insert({ modulo: MODULO_CONFIG_DISPLAYS, user_id: user.id, configuracoes });
    if (error) return error.message;
    setComposicao(nova);
    return null;
  }, []);

  return { composicao, carregando, salvar, recarregar: carregar };
}
