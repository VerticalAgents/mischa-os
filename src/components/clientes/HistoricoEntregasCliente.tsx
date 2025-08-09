
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { Check, X, Calendar, Edit, RotateCcw, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HistoricoEditModal } from "../expedicao/HistoricoEditModal";
import { HistoricoDetalhesModal } from "../expedicao/HistoricoDetalhesModal";
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

  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setFiltroDataInicio(dateValue ? new Date(dateValue) : undefined);
  };

  const handleDataFimChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    setFiltroDataFim(dateValue ? new Date(dateValue) : undefined);
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
                value={filtros.dataInicio ? format(filtros.dataInicio, 'yyyy-MM-dd') : ''}
                onChange={handleDataInicioChange}
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={filtros.dataFim ? format(filtros.dataFim, 'yyyy-MM-dd') : ''}
                onChange={handleDataFimChange}
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
          value={filtros.tipo || 'todos'} 
          onValueChange={(value) => setFiltroTipo(value === 'todos' ? undefined : value as any)}
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
            <HistoricoClienteTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="entrega">
            <HistoricoClienteTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="retorno">
            <HistoricoClienteTable 
              registros={registrosFiltrados}
              onEditarRegistro={handleEditarRegistro}
              onVerDetalhes={handleVerDetalhes}
              isLoading={isLoading}
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

// Componente de tabela específico para cliente (sem coluna do cliente)
const HistoricoClienteTable = ({ 
  registros, 
  onEditarRegistro, 
  onVerDetalhes, 
  isLoading 
}: { 
  registros: any[]; 
  onEditarRegistro: (registro: any) => void;
  onVerDetalhes: (registro: any) => void;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Não há registros no histórico com os filtros selecionados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registros.map((registro) => (
          <TableRow key={registro.id}>
            <TableCell>
              {format(new Date(registro.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {registro.editado_manualmente && (
                <Edit className="inline h-3 w-3 ml-2 text-muted-foreground" />
              )}
            </TableCell>
            <TableCell>
              {registro.tipo === 'entrega' ? (
                <Badge variant="default" className="bg-green-500 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  Entrega
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Retorno
                </Badge>
              )}
            </TableCell>
            <TableCell>{registro.quantidade} unidades</TableCell>
            <TableCell>
              <Badge variant="outline">
                {registro.status_anterior || 'N/A'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVerDetalhes(registro)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditarRegistro(registro)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
