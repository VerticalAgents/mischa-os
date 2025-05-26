
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Settings, Building, User, DollarSign, Users, Package, 
  Factory, Calendar, Tag, Percent, Info 
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import EmpresaTab from "./tabs/EmpresaTab";
import SistemaTab from "./tabs/SistemaTab";
import UsuarioTab from "./tabs/UsuarioTab";
import FinanceiroTab from "./tabs/FinanceiroTab";
import ParametrosClienteTab from "./tabs/ParametrosClienteTab";
import ParametrosEstoqueTab from "./tabs/ParametrosEstoqueTab";
import ProducaoTab from "./tabs/ProducaoTab";
import AgendamentoTab from "./tabs/AgendamentoTab";
import CategoriasProdutoTab from "./tabs/CategoriasProdutoTab";
import ProporcoesTab from "./tabs/ProporcoesTab";
import { useSearchParams } from "react-router-dom";

const TabTriggerWithTooltip = ({ value, icon: Icon, label, tooltip }: {
  value: string;
  icon: any;
  label: string;
  tooltip: string;
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <TabsTrigger value={value} className="flex items-center gap-1">
          <Icon className="h-4 w-4" />
          <span>{label}</span>
          <Info className="h-3 w-3 text-muted-foreground" />
        </TabsTrigger>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export default function ConfiguracoesTabs() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "empresa");
  
  // Atualizar a aba ativa quando a URL mudar
  useEffect(() => {
    if (tabFromUrl && [
      "empresa", "sistema", "usuario", "financeiro", "parametros-cliente", 
      "estoque", "producao", "agendamento", "categorias-produto", "proporcoes"
    ].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  return (
    <div className="space-y-6">
      {/* Título principal */}
      <div>
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Configure todos os parâmetros e regras do sistema organizados por categoria
        </p>
      </div>

      <Tabs defaultValue="empresa" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex mb-8 overflow-x-auto">
          <TabsList className="grid grid-flow-col auto-cols-max gap-2">
            {/* Administração */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded">
              ADMINISTRAÇÃO
            </div>
            
            <TabTriggerWithTooltip
              value="empresa"
              icon={Building}
              label="Empresa"
              tooltip="Configure as informações básicas da sua empresa como nome, CNPJ, endereço e dados de contato"
            />
            
            <TabTriggerWithTooltip
              value="sistema"
              icon={Settings}
              label="Sistema"
              tooltip="Personalize o comportamento geral do sistema, incluindo tema, notificações e configurações de agendamento"
            />
            
            <TabTriggerWithTooltip
              value="usuario"
              icon={User}
              label="Usuário"
              tooltip="Gerencie suas preferências pessoais, informações de perfil e configurações de conta"
            />

            {/* Financeiro */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded ml-4">
              FINANCEIRO
            </div>
            
            <TabTriggerWithTooltip
              value="financeiro"
              icon={DollarSign}
              label="Financeiro"
              tooltip="Configure parâmetros financeiros como moeda, margens de lucro, impostos e formas de pagamento"
            />

            {/* Parâmetros do Cliente */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded ml-4">
              PARÂMETROS DO CLIENTE
            </div>
            
            <TabTriggerWithTooltip
              value="parametros-cliente"
              icon={Users}
              label="Parâmetros do Cliente"
              tooltip="Configure regras e atributos padrões utilizados no cadastro de clientes, rotas e representantes"
            />

            {/* Operações Internas */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded ml-4">
              OPERAÇÕES INTERNAS
            </div>
            
            <TabTriggerWithTooltip
              value="estoque"
              icon={Package}
              label="Estoque"
              tooltip="Gerencie categorias de materiais e parâmetros utilizados no controle de estoque e insumos"
            />
            
            <TabTriggerWithTooltip
              value="producao"
              icon={Factory}
              label="Produção"
              tooltip="Configure parâmetros e regras de capacidade para estimativas e planejamento de produção"
            />

            {/* Reposição */}
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted/50 rounded ml-4">
              REPOSIÇÃO
            </div>
            
            <TabTriggerWithTooltip
              value="agendamento"
              icon={Calendar}
              label="Agendamento"
              tooltip="Configure status de agendamento, periodicidades de reposição e regras de entrega"
            />
            
            <TabTriggerWithTooltip
              value="categorias-produto"
              icon={Tag}
              label="Categorias de Produtos"
              tooltip="Gerencie as categorias utilizadas para classificar produtos no sistema de precificação"
            />
            
            <TabTriggerWithTooltip
              value="proporcoes"
              icon={Percent}
              label="% Proporção Padrão"
              tooltip="Defina a composição percentual padrão dos produtos utilizados em pedidos do tipo 'Padrão'"
            />
          </TabsList>
        </div>
        
        <TabsContent value="empresa">
          <EmpresaTab />
        </TabsContent>
        
        <TabsContent value="sistema">
          <SistemaTab />
        </TabsContent>
        
        <TabsContent value="usuario">
          <UsuarioTab />
        </TabsContent>
        
        <TabsContent value="financeiro">
          <FinanceiroTab />
        </TabsContent>
        
        <TabsContent value="parametros-cliente">
          <ParametrosClienteTab />
        </TabsContent>
        
        <TabsContent value="estoque">
          <ParametrosEstoqueTab />
        </TabsContent>
        
        <TabsContent value="producao">
          <ProducaoTab />
        </TabsContent>
        
        <TabsContent value="agendamento">
          <AgendamentoTab />
        </TabsContent>
        
        <TabsContent value="categorias-produto">
          <CategoriasProdutoTab />
        </TabsContent>

        <TabsContent value="proporcoes">
          <ProporcoesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
