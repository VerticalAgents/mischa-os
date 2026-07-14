import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { NivelEmbalagem } from "@/utils/niveisEmbalagem";

export function useNiveisEmbalagemProduto(produtoId?: string | null) {
  const [niveis, setNiveis] = useState<NivelEmbalagem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const carregar = useCallback(async () => {
    if (!produtoId) {
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
    setLoading(false);
    if (error) {
      console.error("Erro ao carregar níveis:", error);
      return;
    }
    setNiveis((data || []) as NivelEmbalagem[]);
  }, [produtoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const adicionar = async (
    nivel: Omit<NivelEmbalagem, "id" | "produto_id">
  ) => {
    if (!produtoId) return false;
    const { error } = await supabase.from("niveis_embalagem_produto").insert({
      produto_id: produtoId,
      nome: nivel.nome,
      abreviacao: nivel.abreviacao,
      unidades_por_nivel: nivel.unidades_por_nivel,
      ordem: nivel.ordem,
    });
    if (error) {
      toast({
        title: "Erro ao adicionar nível",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    await carregar();
    return true;
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

  return { niveis, loading, adicionar, atualizar, remover, recarregar: carregar };
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
