
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, DollarSign, CalendarClock, Truck, UserCog, Database, BoxesIcon, Calendar, Tag, PackageCheck } from "lucide-react";
import EmpresaTab from "./tabs/EmpresaTab";
import SistemaTab from "./tabs/SistemaTab";
import FinanceiroTab from "./tabs/FinanceiroTab";
import ClientesTab from "./tabs/ClientesTab";
import ProducaoTab from "./tabs/ProducaoTab";
import AgendamentoTab from "./tabs/AgendamentoTab";
import CategoriasProdutoTab from "./tabs/CategoriasProdutoTab";
import ParametrosEstoqueTab from "./tabs/ParametrosEstoqueTab";

export default function ConfiguracoesTabs() {
  const [activeTab, setActiveTab] = useState("empresa");
  
  return <Tabs defaultValue="empresa" value={activeTab} onValueChange={setActiveTab}>
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
          <TabsTrigger value="estoque" className="flex items-center gap-1">
            <PackageCheck className="h-4 w-4" />
            <span>Parâmetros de Estoque</span>
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
      
      <TabsContent value="estoque">
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
    </Tabs>;
}
