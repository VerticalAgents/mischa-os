
import { Cliente } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AnaliseGiro from "@/components/clientes/AnaliseGiro";
import ClienteDetalhesInfo from "@/components/clientes/ClienteDetalhesInfo";
import AgendamentoAtual from "@/components/clientes/AgendamentoAtual";
import { Card, CardContent } from "@/components/ui/card";

interface ClienteDetalhesTabsProps {
  cliente: Cliente;
  onEdit: () => void;
}

export default function ClienteDetalhesTabs({ cliente, onEdit }: ClienteDetalhesTabsProps) {
  return (
    <Tabs defaultValue="info" className="space-y-4">
      <TabsList>
        <TabsTrigger value="info">Informações</TabsTrigger>
        <TabsTrigger value="agendamento-atual">Agendamento Atual</TabsTrigger>
        <TabsTrigger value="analise-giro">Análise de Giro</TabsTrigger>
        <TabsTrigger value="historico">Histórico</TabsTrigger>
      </TabsList>
      
      <TabsContent value="info" className="space-y-4">
        <ClienteDetalhesInfo cliente={cliente} />
      </TabsContent>
      
      <TabsContent value="agendamento-atual" className="space-y-4">
        <AgendamentoAtual cliente={cliente} />
      </TabsContent>
      
      <TabsContent value="analise-giro" className="space-y-4">
        <AnaliseGiro cliente={cliente} />
      </TabsContent>
      
      <TabsContent value="historico" className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Histórico de Pedidos</h3>
            <p className="text-muted-foreground">O histórico de pedidos será implementado em breve.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
