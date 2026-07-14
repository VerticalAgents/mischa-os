import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { NivelEmbalagem } from "@/utils/niveisEmbalagem";
import { useAuth } from "@/contexts/AuthContext";

export function useNiveisEmbalagemProduto(produtoId?: string | null) {
  const [niveis, setNiveis] = useState<NivelEmbalagem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const requestRef = useRef(0);

  const getOwnerId = useCallback(async () => {
    if (!user?.id) return null;
    const { data: ownerId, error } = await supabase.rpc("get_owner_id", { _user_id: user.id });
    if (error || !ownerId) {
      toast({
        title: "Erro ao identificar proprietário",
        description: error?.message,
        variant: "destructive",
      });
      return null;
    }
    return ownerId as string;
  }, [toast, user?.id]);

  const normalizarErroDuplicado = (message: string) => {
    if (message.includes("niveis_embalagem_produto_produto_id_nome_key")) {
      return "Já existe um nível com esse nome para este produto.";
    }
    if (message.includes("niveis_embalagem_produto_produto_id_unidades_por_nivel_key")) {
      return "Já existe um nível com essa quantidade de unidades para este produto.";
    }
    if (message.includes("duplicate key value")) {
      return "Esse nível já existe para este produto.";
    }
    return message;
  };

  const carregar = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    if (!produtoId || authLoading) {
      setNiveis([]);
      return;
    }
    if (!user) {
      setNiveis([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("niveis_embalagem_produto")
      .select("id, produto_id, nome, abreviacao, unidades_por_nivel, ordem")
      .eq("produto_id", produtoId)
      .order("ordem", { ascending: true })
      .order("unidades_por_nivel", { ascending: true });
    if (requestRef.current !== requestId) return;

    setLoading(false);
    if (error) {
      console.error("Erro ao carregar níveis:", error);
      toast({
        title: "Erro ao carregar níveis",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setNiveis((data || []) as NivelEmbalagem[]);
  }, [produtoId, authLoading, user, toast]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionar = async (
    nivel: Omit<NivelEmbalagem, "id" | "produto_id">
  ) => {
    if (!produtoId) return false;
    if (authLoading) return false;
    if (!user?.id) {
      toast({ title: "Sessão expirada", variant: "destructive" });
      return false;
    }
    const ownerId = await getOwnerId();
    if (!ownerId) return false;

    const nomeNormalizado = nivel.nome.trim().toLowerCase();
    const duplicadoLocal = niveis.find(
      (n) => n.nome.trim().toLowerCase() === nomeNormalizado || n.unidades_por_nivel === nivel.unidades_por_nivel
    );
    if (duplicadoLocal) {
      toast({
        title: "Nível já configurado",
        description: `Já existe "${duplicadoLocal.nome}" (${duplicadoLocal.unidades_por_nivel} un) — role a lista de "Níveis configurados" para vê-lo.`,
        variant: "destructive",
      });
      return false;
    }

    const { data, error } = await supabase
      .from("niveis_embalagem_produto")
      .insert({
        produto_id: produtoId,
        nome: nivel.nome,
        abreviacao: nivel.abreviacao,
        unidades_por_nivel: nivel.unidades_por_nivel,
        ordem: nivel.ordem,
        user_id: ownerId,
      })
      .select("id, produto_id, nome, abreviacao, unidades_por_nivel, ordem")
      .single();
    if (error) {
      toast({
        title: "Erro ao adicionar nível",
        description: normalizarErroDuplicado(error.message),
        variant: "destructive",
      });
      // Estado local pode estar dessincronizado — recarrega para exibir o nível existente.
      await carregar();
      return false;
    }
    if (data) {
      setNiveis((atuais) =>
        [...atuais.filter((n) => n.id !== data.id), data as NivelEmbalagem].sort(
          (a, b) => a.ordem - b.ordem || a.unidades_por_nivel - b.unidades_por_nivel
        )
      );
    }
    await carregar();
    return true;
  };

  const copiarDeProduto = async (produtoOrigemId: string) => {
    if (!produtoId || !produtoOrigemId || produtoOrigemId === produtoId) return { ok: false, copiados: 0, ignorados: 0 };
    if (authLoading) return { ok: false, copiados: 0, ignorados: 0 };
    if (!user?.id) {
      toast({ title: "Sessão expirada", variant: "destructive" });
      return { ok: false, copiados: 0, ignorados: 0 };
    }

    const ownerId = await getOwnerId();
    if (!ownerId) return { ok: false, copiados: 0, ignorados: 0 };

    const { data: origem, error: origemError } = await supabase
      .from("niveis_embalagem_produto")
      .select("nome, abreviacao, unidades_por_nivel, ordem")
      .eq("produto_id", produtoOrigemId)
      .order("ordem", { ascending: true })
      .order("unidades_por_nivel", { ascending: true });

    if (origemError) {
      toast({
        title: "Erro ao carregar níveis de origem",
        description: origemError.message,
        variant: "destructive",
      });
      return { ok: false, copiados: 0, ignorados: 0 };
    }

    if (!origem || origem.length === 0) {
      toast({ title: "Produto sem níveis extras", description: "O produto selecionado não tem níveis para copiar." });
      return { ok: true, copiados: 0, ignorados: 0 };
    }

    const { data: atuaisDb, error: atuaisError } = await supabase
      .from("niveis_embalagem_produto")
      .select("nome, unidades_por_nivel, ordem")
      .eq("produto_id", produtoId);

    if (atuaisError) {
      toast({
        title: "Erro ao conferir níveis atuais",
        description: atuaisError.message,
        variant: "destructive",
      });
      return { ok: false, copiados: 0, ignorados: 0 };
    }

    const atuais = atuaisDb || [];
    const nomesAtuais = new Set(atuais.map((n) => n.nome.trim().toLowerCase()));
    const unidadesAtuais = new Set(atuais.map((n) => n.unidades_por_nivel));
    const ordemInicial = atuais.reduce((max, n) => Math.max(max, n.ordem || 0), 0);

    const paraCopiar = origem.filter(
      (n) => !nomesAtuais.has(n.nome.trim().toLowerCase()) && !unidadesAtuais.has(n.unidades_por_nivel)
    );

    if (paraCopiar.length === 0) {
      toast({ title: "Nada novo para copiar", description: "Este produto já possui os mesmos níveis configurados." });
      await carregar();
      return { ok: true, copiados: 0, ignorados: origem.length };
    }

    const registros = paraCopiar.map((nivel, index) => ({
      produto_id: produtoId,
      user_id: ownerId,
      nome: nivel.nome,
      abreviacao: nivel.abreviacao,
      unidades_por_nivel: nivel.unidades_por_nivel,
      ordem: ordemInicial + index + 1,
    }));

    const { data, error } = await supabase
      .from("niveis_embalagem_produto")
      .insert(registros)
      .select("id, produto_id, nome, abreviacao, unidades_por_nivel, ordem");

    if (error) {
      toast({
        title: "Erro ao copiar níveis",
        description: normalizarErroDuplicado(error.message),
        variant: "destructive",
      });
      return { ok: false, copiados: 0, ignorados: origem.length - paraCopiar.length };
    }

    if (data) {
      setNiveis((atuaisLista) =>
        [...atuaisLista, ...(data as NivelEmbalagem[])].sort(
          (a, b) => a.ordem - b.ordem || a.unidades_por_nivel - b.unidades_por_nivel
        )
      );
    }
    await carregar();
    return { ok: true, copiados: data?.length || 0, ignorados: origem.length - paraCopiar.length };
  };

  const atualizar = async (id: string, patch: Partial<NivelEmbalagem>) => {
    const { error } = await supabase
      .from("niveis_embalagem_produto")
      .update({
        nome: patch.nome,
        abreviacao: patch.abreviacao,
        unidades_por_nivel: patch.unidades_por_nivel,
        ordem: patch.ordem,
      })
      .eq("id", id);
    if (error) {
      toast({
        title: "Erro ao atualizar nível",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    await carregar();
    return true;
  };

  const remover = async (id: string) => {
    const { error } = await supabase
      .from("niveis_embalagem_produto")
      .delete()
      .eq("id", id);
    if (error) {
      toast({
        title: "Erro ao remover nível",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    await carregar();
    return true;
  };

  return { niveis, loading: loading || authLoading, adicionar, atualizar, remover, copiarDeProduto, recarregar: carregar };
}

/**
 * Carrega os níveis de vários produtos em lote e retorna um mapa
 * { produto_id: NivelEmbalagem[] }.
 */
export function useNiveisEmbalagemPorProdutos(produtoIds: string[]) {
  const [mapa, setMapa] = useState<Record<string, NivelEmbalagem[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancel = false;
    const carregar = async () => {
      if (produtoIds.length === 0) {
        setMapa({});
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from("niveis_embalagem_produto")
        .select("id, produto_id, nome, abreviacao, unidades_por_nivel, ordem")
        .in("produto_id", produtoIds)
        .order("ordem", { ascending: true });
      setLoading(false);
      if (cancel) return;
      if (error) {
        console.error("Erro ao carregar níveis em lote:", error);
        return;
      }
      const novo: Record<string, NivelEmbalagem[]> = {};
      (data || []).forEach((n: any) => {
        (novo[n.produto_id] ||= []).push(n as NivelEmbalagem);
      });
      setMapa(novo);
    };
    carregar();
    return () => {
      cancel = true;
    };
  }, [produtoIds.join(",")]);

  return { mapa, loading };
}
