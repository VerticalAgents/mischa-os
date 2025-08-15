
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Check, X, Calendar, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoEditModal } from "../expedicao/HistoricoEditModal";
import { HistoricoDetalhesModal } from "../expedicao/HistoricoDetalhesModal";
import { HistoricoTable } from "../expedicao/HistoricoTable";
import { Cliente } from "@/types";

interface HistoricoEntregasClienteProps {
  cliente: Cliente;
}

export const HistoricoEntregasCliente = ({ cliente }: HistoricoEntregasClienteProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<any>(null);
  
  const {
    registros,
    isLoading,
    filtros,
    carregarHistorico,
    setFiltroDataInicio,
    setFiltroDataFim,
    setFiltroTipo,
    resetFiltros,
    getRegistrosFiltrados
  } = useHistoricoEntregasStore();

  useEffect(() => {
    carregarHistorico(cliente.id);
  }, [cliente.id]);

  const registrosFiltrados = getRegistrosFiltrados();
  
  const totalEntregas = registrosFiltrados.filter(r => r.tipo === 'entrega').length;
  const totalRetornos = registrosFiltrados.filter(r => r.tipo === 'retorno').length;

  const handleEditarRegistro = (registro: any) => {
    setRegistroSelecionado(registro);
    setEditModalOpen(true);
  };

  const handleVerDetalhes = (registro: any) => {
    setRegistroSelecionado(registro);
    setDetalhesModalOpen(true);
  };

  const handleResetFiltros = () => {
    resetFiltros();
    carregarHistorico(cliente.id);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Histórico de Entregas do Cliente</h3>
          <p className="text-muted-foreground">
            Visualize todas as entregas e retornos confirmados para {cliente.nome}.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Filtros de Período</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFiltros}
              className="ml-auto"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restaurar Padrão (2 meses)
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={format(filtros.dataInicio, 'yyyy-MM-dd')}
                onChange={(e) => setFiltroDataInicio(new Date(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={format(filtros.dataFim, 'yyyy-MM-dd')}
                onChange={(e) => setFiltroDataFim(new Date(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{registrosFiltrados.length}</div>
            <div className="text-sm text-muted-foreground">Total de Operações</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalEntregas}</div>
            <div className="text-sm text-muted-foreground">Entregas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{totalRetornos}</div>
            <div className="text-sm text-muted-foreground">Retornos</div>
          </Card>
        </div>

        {/* Tabs por tipo */}
        <Tabs 
          value={filtros.tipo} 
          onValueChange={(value) => setFiltroTipo(value as any)}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="todos">
              Todos ({registrosFiltrados.length})
            </TabsTrigger>
            <TabsTrigger value="entrega" className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-600" />
              Entregas ({totalEntregas})
            </TabsTrigger>
            <TabsTrigger value="retorno" className="flex items-center gap-1">
              <X className="h-4 w-4 text-red-600" />
              Retornos ({totalRetornos})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="todos">
            <HistoricoTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
              showClienteColumn={false}
            />
          </TabsContent>
          
          <TabsContent value="entrega">
            <HistoricoTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
              showClienteColumn={false}
            />
          </TabsContent>
          
          <TabsContent value="retorno">
            <HistoricoTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
              showClienteColumn={false}
            />
          </TabsContent>
        </Tabs>
      </div>

      <HistoricoEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        registro={registroSelecionado}
      />

      <HistoricoDetalhesModal
        open={detalhesModalOpen}
        onOpenChange={setDetalhesModalOpen}
        registro={registroSelecionado}
      />
    </Card>
  );
};
