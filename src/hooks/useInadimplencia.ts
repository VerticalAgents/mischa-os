import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMyRepresentanteId } from "@/hooks/useMyRepresentanteId";

export interface TituloAberto {
  id: string;
  codigo?: string;
  descricao?: string;
  valor: number;
  dataVencimento: string; // yyyy-mm-dd
  diasAtraso: number;
  atrasado: boolean;
  nomeClienteGC?: string;
}

export interface ClienteInadimplente {
  clienteId: string | null;
  clienteNome: string;
  representanteId: number | null;
  gestaoClickClienteId: string;
  titulos: TituloAberto[];
  valorEmAberto: number;
  valorAtrasado: number;
  qtdAtrasados: number;
  maiorAtraso: number;
}

function parseDataGC(valor?: string): string | null {
  if (!valor) return null;
  // GestãoClick devolve dd/mm/yyyy ou yyyy-mm-dd
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) {
    const [d, m, y] = valor.split("/");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return valor.slice(0, 10);
  return null;
}

function diffDias(isoVencimento: string): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const venc = new Date(`${isoVencimento}T00:00:00`);
  return Math.floor((hoje.getTime() - venc.getTime()) / 86400000);
}

export function useInadimplencia() {
  const { representanteId, loading: loadingRep } = useMyRepresentanteId();

  const query = useQuery({
    queryKey: ["inadimplencia-gc", representanteId],
    enabled: !loadingRep,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ClienteInadimplente[]> => {
      const { data: configData, error: configError } = await supabase
        .from("integracoes_config")
        .select("config")
        .eq("integracao", "gestaoclick")
        .maybeSingle();

      if (configError) throw configError;
      const config = (configData?.config || {}) as { access_token?: string; secret_token?: string };
      if (!config.access_token || !config.secret_token) {
        throw new Error("Integração com o GestãoClick não configurada");
      }

      const [{ data: fnData, error: fnError }, { data: clientesData, error: clientesError }] =
        await Promise.all([
          supabase.functions.invoke("gestaoclick-proxy", {
            body: {
              action: "buscar_recebimentos_abertos",
              access_token: config.access_token,
              secret_token: config.secret_token,
              meses_retroativos: 12,
            },
          }),
          supabase
            .from("clientes")
            .select("id, nome, representante_id, gestaoclick_cliente_id")
            .not("gestaoclick_cliente_id", "is", null),
        ]);

      if (fnError) throw fnError;
      if (clientesError) throw clientesError;
      if (!fnData?.success) throw new Error(fnData?.error || "Erro ao buscar recebimentos");

      const clientesPorGcId = new Map<string, { id: string; nome: string; representante_id: number | null }>();
      (clientesData || []).forEach((c: any) => {
        if (c.gestaoclick_cliente_id) {
          clientesPorGcId.set(String(c.gestaoclick_cliente_id), {
            id: c.id,
            nome: c.nome,
            representante_id: c.representante_id ?? null,
          });
        }
      });

      const agrupado = new Map<string, ClienteInadimplente>();

      (fnData.recebimentos || []).forEach((rec: any) => {
        const gcId = String(rec.cliente_id || "");
        if (!gcId) return;

        const local = clientesPorGcId.get(gcId);
        // Conta de representante: mostrar somente os clientes dele
        if (representanteId !== null) {
          if (!local || local.representante_id !== representanteId) return;
        }

        const iso = parseDataGC(rec.data_vencimento);
        if (!iso) return;

        const dias = diffDias(iso);
        const valor = parseFloat(String(rec.valor || "0").replace(",", ".")) || 0;

        const titulo: TituloAberto = {
          id: String(rec.id),
          codigo: rec.codigo,
          descricao: rec.descricao,
          valor,
          dataVencimento: iso,
          diasAtraso: dias > 0 ? dias : 0,
          atrasado: dias > 0,
          nomeClienteGC: rec.nome_cliente,
        };

        const atual = agrupado.get(gcId) || {
          clienteId: local?.id ?? null,
          clienteNome: local?.nome || rec.nome_cliente || `Cliente GC ${gcId}`,
          representanteId: local?.representante_id ?? null,
          gestaoClickClienteId: gcId,
          titulos: [],
          valorEmAberto: 0,
          valorAtrasado: 0,
          qtdAtrasados: 0,
          maiorAtraso: 0,
        };

        atual.titulos.push(titulo);
        atual.valorEmAberto += valor;
        if (titulo.atrasado) {
          atual.valorAtrasado += valor;
          atual.qtdAtrasados += 1;
          atual.maiorAtraso = Math.max(atual.maiorAtraso, titulo.diasAtraso);
        }

        agrupado.set(gcId, atual);
      });

      return Array.from(agrupado.values())
        .map((c) => ({
          ...c,
          titulos: c.titulos.sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
        }))
        .sort((a, b) => b.valorAtrasado - a.valorAtrasado || b.valorEmAberto - a.valorEmAberto);
    },
  });

  return {
    clientes: query.data || [],
    loading: query.isLoading || loadingRep,
    error: query.error as Error | null,
    refetch: query.refetch,
    isRepresentante: representanteId !== null,
  };
}

/** Situação financeira de um cliente específico (por id local). */
export function useSituacaoFinanceiraCliente(clienteId?: string | null) {
  const { clientes, loading } = useInadimplencia();
  const registro = clienteId ? clientes.find((c) => c.clienteId === clienteId) : undefined;
  return {
    loading,
    temAtraso: !!registro && registro.qtdAtrasados > 0,
    registro,
  };
}
