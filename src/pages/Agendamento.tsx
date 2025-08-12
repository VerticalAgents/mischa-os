
import { useEffect, useState } from "react";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgendamentoDashboard from "@/components/agendamento/AgendamentoDashboard";
import TodosAgendamentos from "@/components/agendamento/TodosAgendamentos";
import AgendamentosPendentes from "@/components/agendamento/AgendamentosPendentes";
import AgendamentosAtrasados from "@/components/agendamento/AgendamentosAtrasados";
import AgendamentosDespachados from "@/components/agendamento/AgendamentosDespachados";
import AgendamentoRepresentantes from "@/components/agendamento/AgendamentoRepresentantes";
import NovaConfirmacaoReposicaoTab from "@/components/agendamento/NovaConfirmacaoReposicaoTab";
import { useSearchParams } from "react-router-dom";
import { useTabPersistence } from "@/hooks/useTabPersistence";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";

export default function Agendamento() {
  const [searchParams] = useSearchParams();
  const {
    activeTab,
    changeTab
  } = useTabPersistence("dashboard");
  const {
    clientes
  } = useClienteStore();
  const {
    agendamentos
  } = useAgendamentoClienteStore();

  // Estados para controlar a visibilidade das abas
  const [temAgendamentosPendentes, setTemAgendamentosPendentes] = useState(false);
  const [temAgendamentosAtrasados, setTemAgendamentosAtrasados] = useState(false);
  const [temAgendamentosDespachados, setTemAgendamentosDespachados] = useState(false);

  useEffect(() => {
    // Verificar se há parâmetro de tab na URL e atualizar
    const tab = searchParams.get("tab");
    if (tab && ["dashboard", "agendamentos", "representantes", "confirmacao", "pendentes", "atrasados", "despachados"].includes(tab)) {
      changeTab(tab);
    }
  }, [searchParams, changeTab]);

  useEffect(() => {
    // Verificar se há clientes sem agendamento
    const clientesComAgendamento = new Set(agendamentos.map(a => a.cliente.id));
    const clientesSemAgendamento = clientes.filter(cliente => cliente.ativo && !clientesComAgendamento.has(cliente.id));
    setTemAgendamentosPendentes(clientesSemAgendamento.length > 0);

    // Verificar se há agendamentos atrasados
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const agendamentosAtrasados = agendamentos.filter(agendamento => {
      const dataAgendamento = new Date(agendamento.dataReposicao);
      dataAgendamento.setHours(0, 0, 0, 0);
      return dataAgendamento < hoje;
    });
    setTemAgendamentosAtrasados(agendamentosAtrasados.length > 0);

    // Verificar se há agendamentos despachados - usando statusPedido do objeto pedido
    const agendamentosDespachados = agendamentos.filter(agendamento => 
      agendamento.statusAgendamento === "Agendado" && 
      agendamento.pedido?.statusPedido === "Despachado"
    );
    setTemAgendamentosDespachados(agendamentosDespachados.length > 0);
  }, [clientes, agendamentos]);

  return (
    <div className="space-y-6">
      <PageHeader title="Agendamento" description="Gerenciamento de agendamentos e confirmação de reposições" />
      
      <Tabs value={activeTab} onValueChange={changeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
          <TabsTrigger value="representantes">Representantes</TabsTrigger>
          <TabsTrigger value="confirmacao">Confirmação de Reposição</TabsTrigger>
          {temAgendamentosPendentes && <TabsTrigger value="pendentes">Pendente</TabsTrigger>}
          {temAgendamentosAtrasados && <TabsTrigger value="atrasados">Atrasado</TabsTrigger>}
          {temAgendamentosDespachados && <TabsTrigger value="despachados">Despachado</TabsTrigger>}
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4">
          <AgendamentoDashboard />
        </TabsContent>
        
        <TabsContent value="agendamentos" className="space-y-4">
          <TodosAgendamentos />
        </TabsContent>
        
        <TabsContent value="representantes" className="space-y-4">
          <AgendamentoRepresentantes />
        </TabsContent>
        
        <TabsContent value="confirmacao" className="space-y-4">
          <NovaConfirmacaoReposicaoTab />
        </TabsContent>
        
        {temAgendamentosPendentes && (
          <TabsContent value="pendentes" className="space-y-4">
            <AgendamentosPendentes />
          </TabsContent>
        )}
        
        {temAgendamentosAtrasados && (
          <TabsContent value="atrasados" className="space-y-4">
            <AgendamentosAtrasados />
          </TabsContent>
        )}
        
        {temAgendamentosDespachados && (
          <TabsContent value="despachados" className="space-y-4">
            <AgendamentosDespachados />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
