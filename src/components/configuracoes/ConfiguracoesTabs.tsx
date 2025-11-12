
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { useTabPersistence } from "@/hooks/useTabPersistence";

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

const configGroups = [
  {
    title: "Administração",
    tabs: [
      { id: "empresa", label: "Empresa", component: EmpresaTab },
      { id: "usuario", label: "Usuário", component: UsuarioTab },
      { id: "sistema", label: "Sistema", component: SistemaTab },
      { id: "agentes-ia", label: "Agentes IA", component: AgentesIAConfigTab },
    ]
  },
  {
    title: "Financeiro",
    tabs: [
      { id: "financeiro", label: "Parâmetros", component: FinanceiroTab },
      { id: "precificacao", label: "Precificação", component: PrecificacaoTab },
      { id: "custos", label: "Custos", component: CustosTab },
      { id: "cartoes-credito", label: "Cartões de Crédito", component: CartoesTab },
    ]
  },
  {
    title: "Produtos & Estoque",
    tabs: [
      { id: "categorias-produto", label: "Categorias", component: CategoriasProdutoTab },
      { id: "proporcoes", label: "Proporções", component: ProporcoesTab },
      { id: "parametros-estoque", label: "Estoque", component: ParametrosEstoqueTab },
    ]
  },
  {
    title: "Operações",
    tabs: [
      { id: "clientes", label: "Clientes", component: ClientesTab },
      { id: "agendamento", label: "Agendamento", component: AgendamentoTab },
      { id: "producao", label: "Produção", component: ProducaoTab },
    ]
  }
];

export default function ConfiguracoesTabs() {
  const { activeTab, changeTab } = useTabPersistence("empresa");

  const allTabs = configGroups.flatMap(group => group.tabs);
  const activeTabData = allTabs.find(tab => tab.id === activeTab) || allTabs[0];

  return (
    <div className="w-full space-y-6">
      <Tabs value={activeTab} onValueChange={changeTab} className="w-full">
        <div className="space-y-4">
          {/* Menu organizado por categorias */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {configGroups.map((group, groupIndex) => (
                  <div key={group.title}>
                    <div className="mb-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        {group.title}
                      </h3>
                    </div>
                    
                    <TabsList className="h-auto p-1 grid grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap gap-1">
                      {group.tabs.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="text-sm px-4 py-2 flex-shrink-0"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {groupIndex < configGroups.length - 1 && (
                      <Separator className="mt-4" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Conteúdo das abas */}
        <div className="w-full">
          {allTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="w-full">
              <div className="w-full">
                <tab.component />
              </div>
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
}
