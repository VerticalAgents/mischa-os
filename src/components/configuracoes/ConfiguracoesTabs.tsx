
import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, DollarSign, CalendarClock, Truck, UserCog, Database, BoxesIcon, Calendar, Tag, Package, User, Percent } from "lucide-react";
import EmpresaTab from "./tabs/EmpresaTab";
import SistemaTab from "./tabs/SistemaTab";
import FinanceiroTab from "./tabs/FinanceiroTab";
import ClientesTab from "./tabs/ClientesTab";
import ProducaoTab from "./tabs/ProducaoTab";
import AgendamentoTab from "./tabs/AgendamentoTab";
import CategoriasProdutoTab from "./tabs/CategoriasProdutoTab";
import ParametrosEstoqueTab from "./tabs/ParametrosEstoqueTab";
import UsuarioTab from "./tabs/UsuarioTab";
import ProporcoesTab from "./tabs/ProporcoesTab";
import { useSearchParams } from "react-router-dom";

export default function ConfiguracoesTabs() {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "empresa");
  
  // Atualizar a aba ativa quando a URL mudar
  useEffect(() => {
    if (tabFromUrl && ["empresa", "sistema", "financeiro", "parametros", "parametros-estoque", 
                     "producao", "agendamento", "categorias", "proporcoes", "usuario"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  return (
    <Tabs defaultValue="empresa" value={activeTab} onValueChange={setActiveTab}>
      <div className="flex mb-8 overflow-x-auto">
        <TabsList className="grid grid-flow-col auto-cols-max gap-2">
          <TabsTrigger value="empresa" className="flex items-center gap-1">
            <UserCog className="h-4 w-4" />
            <span>Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="parametros" className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>Parâmetros</span>
          </TabsTrigger>
          <TabsTrigger value="parametros-estoque" className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>Estoque</span>
          </TabsTrigger>
          <TabsTrigger value="producao" className="flex items-center gap-1">
            <BoxesIcon className="h-4 w-4" />
            <span>Produção</span>
          </TabsTrigger>
          <TabsTrigger value="agendamento" className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>Agendamento</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="proporcoes" className="flex items-center gap-1">
            <Percent className="h-4 w-4" />
            <span>Proporção Padrão</span>
          </TabsTrigger>
          <TabsTrigger value="usuario" className="flex items-center gap-1">
            <User className="h-4 w-4" />
            <span>Usuário</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="empresa">
        <EmpresaTab />
      </TabsContent>
      
      <TabsContent value="sistema">
        <SistemaTab />
      </TabsContent>
      
      <TabsContent value="financeiro">
        <FinanceiroTab />
      </TabsContent>
      
      <TabsContent value="parametros">
        <ClientesTab />
      </TabsContent>
      
      <TabsContent value="parametros-estoque">
        <ParametrosEstoqueTab />
      </TabsContent>
      
      <TabsContent value="producao">
        <ProducaoTab />
      </TabsContent>
      
      <TabsContent value="agendamento">
        <AgendamentoTab />
      </TabsContent>
      
      <TabsContent value="categorias">
        <CategoriasProdutoTab />
      </TabsContent>

      <TabsContent value="proporcoes">
        <ProporcoesTab />
      </TabsContent>

      <TabsContent value="usuario">
        <UsuarioTab />
      </TabsContent>
    </Tabs>
  );
}
