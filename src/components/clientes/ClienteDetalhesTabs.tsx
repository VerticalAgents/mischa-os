
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useUserRoles } from "@/hooks/useUserRoles";
import { MODELO_DISPLAYS } from "@/utils/pedidoDisplays";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cliente } from "@/types";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import ClienteDetalhesInfo from "./ClienteDetalhesInfo";
import AgendamentoAtual from "./AgendamentoAtual";
import AnaliseGiro from "./AnaliseGiro";
import { HistoricoEntregasCliente } from "./HistoricoEntregasCliente";
import ClienteFinanceiro from "./ClienteFinanceiro";

interface ClienteDetalhesTabsProps {
  cliente: Cliente;
  onAgendamentoUpdate?: () => void;
  refreshTrigger?: number;
  hideFinanceiro?: boolean;
}

export default function ClienteDetalhesTabs({ 
  cliente, 
  onAgendamentoUpdate,
  refreshTrigger,
  hideFinanceiro = false,
}: ClienteDetalhesTabsProps) {
  const { activeTab, changeTab } = useTabPersistence("informacoes");
  const { isRepresentante } = useUserRoles();
  const navigate = useNavigate();
  // Representante não mexe na agenda de cliente de displays: o pedido é lançado na tela de Pedidos.
  const pedidoPelaTelaDePedidos = isRepresentante() && cliente.modeloPedido === MODELO_DISPLAYS;

  const mobileTabs = [
    { id: "informacoes", label: "Informações" },
    { id: "agendamento", label: "Agendamento Atual" },
    { id: "analise", label: "Análise de Giro" },
    ...(!hideFinanceiro ? [{ id: "financeiro", label: "Financeiro" }] : []),
    { id: "historico", label: "Histórico de Entregas" },
  ];

  return (
    <Tabs value={activeTab} onValueChange={changeTab} className="space-y-6">
      {/* Mobile: grid 2 colunas */}
      <div className="grid grid-cols-2 gap-2 lg:hidden">
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => changeTab(tab.id)}
            className={`rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Desktop */}
      <TabsList className={`hidden lg:grid w-full ${hideFinanceiro ? 'grid-cols-4' : 'grid-cols-5'} h-12 bg-gray-100 rounded-lg p-1`}>
        <TabsTrigger value="informacoes" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
          Informações
        </TabsTrigger>
        <TabsTrigger value="agendamento" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
          Agendamento Atual
        </TabsTrigger>
        <TabsTrigger value="analise" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
          Análise de Giro
        </TabsTrigger>
        {!hideFinanceiro && (
          <TabsTrigger value="financeiro" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
            Financeiro
          </TabsTrigger>
        )}
        <TabsTrigger value="historico" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium">
          Histórico de Entregas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="informacoes" className="mt-6">
        <ClienteDetalhesInfo cliente={cliente} />
      </TabsContent>

      <TabsContent value="agendamento" className="mt-6">
        {pedidoPelaTelaDePedidos ? (
          <div className="rounded-lg border p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Este cliente compra em displays. O pedido é lançado, alterado e cancelado na tela de Pedidos.
            </p>
            <Button className="h-11" onClick={() => navigate(`/rep/pedidos?cliente=${cliente.id}`)}>
              Fazer pedido
            </Button>
          </div>
        ) : (
          <AgendamentoAtual 
            cliente={cliente} 
            onAgendamentoUpdate={onAgendamentoUpdate}
            key={refreshTrigger}
          />
        )}
      </TabsContent>

      <TabsContent value="analise" className="mt-6">
        <AnaliseGiro cliente={cliente} />
      </TabsContent>

      {!hideFinanceiro && (
        <TabsContent value="financeiro" className="mt-6">
          <ClienteFinanceiro cliente={cliente} />
        </TabsContent>
      )}

      <TabsContent value="historico" className="mt-6">
        <HistoricoEntregasCliente cliente={cliente} />
      </TabsContent>
    </Tabs>
  );
}
