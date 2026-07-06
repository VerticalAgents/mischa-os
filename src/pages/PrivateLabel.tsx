import { useState, useEffect } from 'react';
import PageHeader from '@/components/common/PageHeader';
import { Factory } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClientesIndustriais } from '@/hooks/usePrivateLabel';
import ClientesIndustriaisTab from '@/components/private-label/ClientesIndustriaisTab';
import InsumosPLTab from '@/components/private-label/InsumosPLTab';
import ProdutosPLTab from '@/components/private-label/ProdutosPLTab';

export default function PrivateLabel() {
  const { clientes } = useClientesIndustriais();
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [tab, setTab] = useState('clientes');

  useEffect(() => {
    if (!clienteId && clientes.length > 0) setClienteId(clientes[0].id);
  }, [clientes, clienteId]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Private-Label"
        description="Operação de industrialização terceirizada: insumos consignados, produção e coleta."
        icon={<Factory className="h-5 w-5" />}
      />

      <div className="mt-6 flex-1 min-h-0">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <TabsList>
              <TabsTrigger value="clientes">Clientes Industriais</TabsTrigger>
              <TabsTrigger value="insumos">Insumos Consignados</TabsTrigger>
              <TabsTrigger value="produtos">Produtos & Fichas</TabsTrigger>
            </TabsList>

            {tab !== 'clientes' && clientes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <Select value={clienteId ?? undefined} onValueChange={setClienteId}>
                  <SelectTrigger className="w-[260px]"><SelectValue placeholder="Selecionar cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <TabsContent value="clientes"><ClientesIndustriaisTab /></TabsContent>
          <TabsContent value="insumos"><InsumosPLTab clienteIndustrialId={clienteId} /></TabsContent>
          <TabsContent value="produtos"><ProdutosPLTab clienteIndustrialId={clienteId} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}