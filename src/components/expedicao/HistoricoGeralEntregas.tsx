
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Check, X, Calendar, RotateCcw, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoEditModal } from "./HistoricoEditModal";
import { HistoricoDetalhesModal } from "./HistoricoDetalhesModal";
import { NovaEntregaManualModal } from "./NovaEntregaManualModal";
import { HistoricoTable } from "./HistoricoTable";

export const HistoricoGeralEntregas = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [novaEntregaModalOpen, setNovaEntregaModalOpen] = useState(false);
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

  // Carrega dados na montagem do componente
  useEffect(() => {
    console.log('HistoricoGeralEntregas: Carregando histórico na montagem');
    carregarHistorico();
  }, [carregarHistorico]);

  // Debug: Log do estado atual
  useEffect(() => {
    console.log('HistoricoGeralEntregas: Estado atual:', {
      totalRegistros: registros.length,
      isLoading,
      filtros
    });
  }, [registros, isLoading, filtros]);

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
    console.log('HistoricoGeralEntregas: Resetando filtros');
    resetFiltros();
    // Forçar recarga dos dados após reset
    setTimeout(() => {
      carregarHistorico();
    }, 100);
  };

  // Forçar recarga quando filtros mudam
  const handleFiltroChange = () => {
    console.log('HistoricoGeralEntregas: Filtros alterados, recarregando dados');
    carregarHistorico();
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Histórico Geral de Entregas</h2>
            <p className="text-muted-foreground">
              Visualize todas as entregas e retornos confirmados no sistema.
            </p>
          </div>
          <Button onClick={() => setNovaEntregaModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nova Entrega Manual
          </Button>
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
                onChange={(e) => {
                  setFiltroDataInicio(new Date(e.target.value));
                  handleFiltroChange();
                }}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={format(filtros.dataFim, 'yyyy-MM-dd')}
                onChange={(e) => {
                  setFiltroDataFim(new Date(e.target.value));
                  handleFiltroChange();
                }}
              />
            </div>
          </div>
        </div>

        {/* Debug info para desenvolvimento */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 p-3 rounded text-sm">
            <strong>Debug:</strong> {registros.length} registros carregados, {registrosFiltrados.length} após filtros
          </div>
        )}

        {/* Tabs por tipo */}
        <Tabs 
          value={filtros.tipo} 
          onValueChange={(value) => {
            setFiltroTipo(value as any);
            handleFiltroChange();
          }}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="todos">
              Todos ({registrosFiltrados.length})
            </TabsTrigger>
            <TabsTrigger value="entrega" className="flex items-center gap-1">
              <Check className="h-4 w-4 text-green-600" />
              Entregas Confirmadas ({totalEntregas})
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
              showClienteColumn={true}
            />
          </TabsContent>
          
          <TabsContent value="entrega">
            <HistoricoTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
              showClienteColumn={true}
            />
          </TabsContent>
          
          <TabsContent value="retorno">
            <HistoricoTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
              showClienteColumn={true}
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

      <NovaEntregaManualModal
        open={novaEntregaModalOpen}
        onOpenChange={setNovaEntregaModalOpen}
      />
    </Card>
  );
};
