import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GerarNFResult {
  success: boolean;
  nfId: string | null;
  status?: 'em_aberto' | 'emitida';
  warning?: string;
  error?: string;
}

interface EmitirNFResult {
  success: boolean;
  emitida: boolean;
  warning?: string;
  error?: string;
}

interface GerarNFsEmMassaResult {
  sucesso: number;
  falha: number;
  erros: string[];
}

export function useGestaoClickNF() {
  const [loading, setLoading] = useState(false);
  const [loadingEmitir, setLoadingEmitir] = useState(false);

  // Gerar NF como rascunho (em_aberto) - NÃO emite automaticamente
  const gerarNF = async (agendamentoId: string, clienteId: string): Promise<GerarNFResult> => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, nfId: null, error: "Usuário não autenticado" };
      }

      const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
        body: {
          action: "criar_nf",
          agendamento_id: agendamentoId,
          cliente_id: clienteId
        }
      });

      if (error) {
        console.error("[useGestaoClickNF] Error:", error);
        return { success: false, nfId: null, error: error.message };
      }

      if (data?.error) {
        return { success: false, nfId: data?.nf_id || null, error: data.error };
      }

      // Sucesso - NF criada como rascunho
      return { 
        success: true, 
        nfId: data?.nf_id || null,
        status: data?.status || 'em_aberto',
        warning: data?.warning
      };
    } catch (err: any) {
      console.error("[useGestaoClickNF] Exception:", err);
      return { success: false, nfId: null, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Emitir NF existente (segunda etapa)
  const emitirNF = async (nfId: string, agendamentoId: string): Promise<EmitirNFResult> => {
    setLoadingEmitir(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return { success: false, emitida: false, error: "Usuário não autenticado" };
      }

      const { data, error } = await supabase.functions.invoke("gestaoclick-proxy", {
        body: {
          action: "emitir_nf",
          nf_id: nfId,
          agendamento_id: agendamentoId
        }
      });

      if (error) {
        console.error("[useGestaoClickNF] Emitir error:", error);
        return { success: false, emitida: false, error: error.message };
      }

      if (data?.error) {
        return { success: false, emitida: false, error: data.error };
      }

      if (data?.emitida === false) {
        return { 
          success: true, 
          emitida: false, 
          warning: data?.warning || data?.motivo_nao_emitida || "NF não pôde ser emitida"
        };
      }

      return { success: true, emitida: true };
    } catch (err: any) {
      console.error("[useGestaoClickNF] Emitir exception:", err);
      return { success: false, emitida: false, error: err.message };
    } finally {
      setLoadingEmitir(false);
    }
  };

  const gerarNFsEmMassa = async (
    agendamentos: { id: string; clienteId: string }[]
  ): Promise<GerarNFsEmMassaResult> => {
    setLoading(true);
    let sucesso = 0;
    let falha = 0;
    const erros: string[] = [];

    // Process sequentially to avoid rate limiting
    for (const ag of agendamentos) {
      const result = await gerarNF(ag.id, ag.clienteId);
      if (result.success) {
        sucesso++;
        if (result.warning) {
          erros.push(result.warning);
        }
      } else {
        falha++;
        if (result.error) {
          erros.push(result.error);
        }
      }
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);
    return { sucesso, falha, erros };
  };

  const abrirNF = (nfId: string) => {
    const url = `https://app.gestaoclick.com/notas_fiscais/visualizar/${nfId}`;
    window.open(url, "_blank");
    toast.info("Abrindo NF no GestaoClick...");
  };

  return {
    gerarNF,
    emitirNF,
    gerarNFsEmMassa,
    abrirNF,
    loading,
    loadingEmitir
  };
}
