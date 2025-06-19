
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Truck, DollarSign, CreditCard } from "lucide-react";

import RepresentantesList from "../listas/RepresentantesList";
import RotasEntregaList from "../listas/RotasEntregaList";
import CategoriasEstabelecimentoList from "../listas/CategoriasEstabelecimentoList";
import TiposLogisticaList from "../listas/TiposLogisticaList";
import FormasPagamentoList from "../listas/FormasPagamentoList";
import TiposCobrancaList from "../listas/TiposCobrancaList";

export default function ClientesTab() {
  const [activeLista, setActiveLista] = useState("representantes");
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Truck className="h-4 w-4" />
          <CardTitle>Parâmetros do Cliente</CardTitle>
        </div>
        <CardDescription>
          Configure os parâmetros utilizados no cadastro de clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="representantes" 
          value={activeLista} 
          onValueChange={setActiveLista}
          className="space-y-4"
        >
          <TabsList className="grid grid-cols-6 gap-2">
            <TabsTrigger value="representantes">Representantes</TabsTrigger>
            <TabsTrigger value="rotas">Rotas de Entrega</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="logistica">Tipos de Logística</TabsTrigger>
            <TabsTrigger value="pagamento">Formas de Pagamento</TabsTrigger>
            <TabsTrigger value="cobranca">
              <div className="flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                <span>Cobrança</span>
              </div>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="representantes">
            <RepresentantesList />
          </TabsContent>
          
          <TabsContent value="rotas">
            <RotasEntregaList />
          </TabsContent>
          
          <TabsContent value="categorias">
            <CategoriasEstabelecimentoList />
          </TabsContent>
          
          <TabsContent value="logistica">
            <TiposLogisticaList />
          </TabsContent>
          
          <TabsContent value="pagamento">
            <FormasPagamentoList />
          </TabsContent>

          <TabsContent value="cobranca">
            <TiposCobrancaList />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
