
import { useTabPersistence } from "@/hooks/useTabPersistence";
import ConfiguracoesNavigation, { configGroups } from "./ConfiguracoesNavigation";

// Importações das abas
import EmpresaTab from "./tabs/EmpresaTab";
import UsuarioTab from "./tabs/UsuarioTab";
import SistemaTab from "./tabs/SistemaTab";
import AgentesIAConfigTab from "./tabs/AgentesIAConfigTab";
import FinanceiroTab from "./tabs/FinanceiroTab";
import PrecificacaoTab from "./tabs/PrecificacaoTab";
import CustosTab from "./tabs/CustosTab";
import CartoesTab from "./tabs/CartoesTab";
import CategoriasProdutoTab from "./tabs/CategoriasProdutoTab";
import ProporcoesTab from "./tabs/ProporcoesTab";
import ClientesTab from "./tabs/ClientesTab";
import AgendamentoTab from "./tabs/AgendamentoTab";
import ProducaoTab from "./tabs/ProducaoTab";
import ParametrosEstoqueTab from "./tabs/ParametrosEstoqueTab";
import IntegracoesGestaoClickTab from "./tabs/IntegracoesGestaoClickTab";

// Mapeamento de componentes por ID
const tabComponents: Record<string, React.ComponentType> = {
  "empresa": EmpresaTab,
  "usuario": UsuarioTab,
  "sistema": SistemaTab,
  "agentes-ia": AgentesIAConfigTab,
  "financeiro": FinanceiroTab,
  "precificacao": PrecificacaoTab,
  "custos": CustosTab,
  "cartoes-credito": CartoesTab,
  "categorias-produto": CategoriasProdutoTab,
  "proporcoes": ProporcoesTab,
  "parametros-estoque": ParametrosEstoqueTab,
  "clientes": ClientesTab,
  "agendamento": AgendamentoTab,
  "producao": ProducaoTab,
  "gestaoclick": IntegracoesGestaoClickTab,
};

export default function ConfiguracoesTabs() {
  const { activeTab, changeTab } = useTabPersistence("empresa");

  // Obtém o componente ativo
  const ActiveComponent = tabComponents[activeTab] || EmpresaTab;

  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-lg bg-background overflow-hidden">
      {/* Sidebar de navegação */}
      <ConfiguracoesNavigation 
        currentTab={activeTab}
        onTabChange={changeTab}
      />
      
      {/* Área de conteúdo */}
      <div className="flex-1 overflow-auto p-6">
        <ActiveComponent />
      </div>
    </div>
  );
}
