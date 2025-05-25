
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Plus, Edit, Info } from "lucide-react";
import { format, addDays } from "date-fns";
import { useSaborStore } from "@/hooks/useSaborStore";
import { useHistoricoProducaoStore } from "@/hooks/useHistoricoProducaoStore";

interface ProducaoAgendadaItem {
  id: number;
  data: Date;
  diaSemana: string;
  idSabor: number;
  nomeSabor: string;
  formasAgendadas: number;
}

export default function ProducaoAgendadaTab() {
  const { sabores } = useSaborStore();
  const { adicionarRegistroHistorico } = useHistoricoProducaoStore();
  
  // Mock data for scheduled production - in a real app, this would come from a store
  const [producaoAgendada, setProducaoAgendada] = useState<ProducaoAgendadaItem[]>([
    {
      id: 1,
      data: new Date(),
      diaSemana: 'Seg',
      idSabor: 1,
      nomeSabor: 'Tradicional',
      formasAgendadas: 8
    },
    {
      id: 2,
      data: new Date(),
      diaSemana: 'Seg',
      idSabor: 2,
      nomeSabor: 'Choco Duo',
      formasAgendadas: 6
    },
    {
      id: 3,
      data: addDays(new Date(), 1),
      diaSemana: 'Ter',
      idSabor: 1,
      nomeSabor: 'Tradicional',
      formasAgendadas: 10
    },
    {
      id: 4,
      data: addDays(new Date(), 1),
      diaSemana: 'Ter',
      idSabor: 3,
      nomeSabor: 'Mesclado',
      formasAgendadas: 4
    },
    {
      id: 5,
      data: addDays(new Date(), 2),
      diaSemana: 'Qua',
      idSabor: 2,
      nomeSabor: 'Choco Duo',
      formasAgendadas: 7
    }
  ]);

  // Group production by date
  const producaoPorData = producaoAgendada.reduce((acc, item) => {
    const dateKey = format(item.data, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, ProducaoAgendadaItem[]>);

  // Get unique dates and sort them
  const datasOrdenadas = Object.keys(producaoPorData)
    .sort()
    .map(dateKey => new Date(dateKey));

  const adicionarProducao = () => {
    // In a real app, this would open a dialog to add new production
    console.log("Adicionar nova produção agendada");
  };

  const editarProducao = (id: number) => {
    // In a real app, this would open a dialog to edit production
    console.log("Editar produção agendada", id);
  };

  const confirmarProducao = (item: ProducaoAgendadaItem) => {
    // Add to production history when production is confirmed
    adicionarRegistroHistorico({
      dataProducao: item.data,
      produtoId: item.idSabor,
      produtoNome: item.nomeSabor,
      formasProducidas: item.formasAgendadas,
      unidadesCalculadas: item.formasAgendadas * 30, // Assuming 30 units per form
      turno: 'Automático', // Default turno for scheduled production
      observacoes: 'Produção executada conforme agendamento',
      origem: 'Agendada'
    });
    
    // Remove from scheduled production
    setProducaoAgendada(prev => prev.filter(p => p.id !== item.id));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Produção Agendada (Formas)
          </CardTitle>
          <CardDescription>
            Visualize todas as produções programadas por sabor nos próximos dias. Base para o cálculo da disponibilidade futura de estoque.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Button onClick={adicionarProducao} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agendar Produção
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          As produções agendadas aqui impactam a projeção de disponibilidade futura e são automaticamente registradas no histórico quando executadas.
        </AlertDescription>
      </Alert>

      {/* Tabela de Produção Agendada */}
      <Card>
        <CardHeader>
          <CardTitle>Programação de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Dia da Semana</TableHead>
                  <TableHead>Sabor</TableHead>
                  <TableHead className="text-right">Formas Agendadas</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasOrdenadas.length > 0 ? (
                  datasOrdenadas.map(data => {
                    const dateKey = format(data, 'yyyy-MM-dd');
                    const producoesDaData = producaoPorData[dateKey] || [];
                    
                    return producoesDaData.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {index === 0 ? format(data, 'dd/MM/yyyy') : ''}
                        </TableCell>
                        <TableCell>
                          {index === 0 ? format(data, 'EEEE').substring(0, 3) : ''}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.nomeSabor}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="default">
                            {item.formasAgendadas}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editarProducao(item.id)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => confirmarProducao(item)}
                              className="flex items-center gap-1"
                            >
                              Confirmar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Nenhuma produção agendada encontrada
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {producaoAgendada.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total de formas agendadas:</span>
                <Badge variant="default" className="text-lg px-3 py-1">
                  {producaoAgendada.reduce((sum, item) => sum + item.formasAgendadas, 0)} formas
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Distribuídas em {Object.keys(producaoPorData).length} dias de produção
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
