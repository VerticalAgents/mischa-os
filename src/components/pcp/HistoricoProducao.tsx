
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PinDialog } from "@/components/ui/pin-dialog";

interface HistoricoProducaoItem {
  id: string;
  data_producao: string;
  produto_id?: string;
  produto_nome: string;
  formas_producidas: number;
  unidades_calculadas: number;
  turno?: string;
  observacoes?: string;
  origem: string;
  created_at: string;
  updated_at: string;
}

export default function HistoricoProducao() {
  const [historico, setHistorico] = useState<HistoricoProducaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoricoProducaoItem | null>(null);

  const carregarHistorico = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('historico_producao')
        .select('*')
        .order('data_producao', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar histórico:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar o histórico de produção",
          variant: "destructive",
        });
        return;
      }

      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarPin = (action: 'create' | 'edit' | 'delete', item?: HistoricoProducaoItem) => {
    setPendingAction(action);
    setSelectedItem(item || null);
    setShowPinDialog(true);
  };

  const handlePinConfirmed = () => {
    if (pendingAction === 'create') {
      handleCriarRegistro();
    } else if (pendingAction === 'edit' && selectedItem) {
      handleEditarRegistro(selectedItem);
    } else if (pendingAction === 'delete' && selectedItem) {
      handleExcluirRegistro(selectedItem.id);
    }
    
    // Limpar estado
    setPendingAction(null);
    setSelectedItem(null);
  };

  const handleCriarRegistro = () => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Modal de criação será implementado em breve",
    });
  };

  const handleEditarRegistro = (item: HistoricoProducaoItem) => {
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "Modal de edição será implementado em breve",
    });
  };

  const handleExcluirRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('historico_producao')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao excluir registro:', error);
        toast({
          title: "Erro",
          description: "Não foi possível excluir o registro",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Registro excluído",
        description: "Registro de produção excluído com sucesso",
      });

      carregarHistorico();
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    carregarHistorico();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Histórico de Produção</CardTitle>
              <CardDescription>
                Registro de todas as produções realizadas
              </CardDescription>
            </div>
            <Button onClick={() => solicitarPin('create')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Registro
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Formas</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Carregando histórico...
                    </TableCell>
                  </TableRow>
                ) : historico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Nenhum registro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.data_producao), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.produto_nome}
                      </TableCell>
                      <TableCell>{item.formas_producidas}</TableCell>
                      <TableCell>{item.unidades_calculadas}</TableCell>
                      <TableCell>
                        {item.turno && (
                          <Badge variant="outline">{item.turno}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.origem === 'Manual' ? 'secondary' : 'default'}>
                          {item.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.observacoes && (
                          <span className="text-sm text-muted-foreground">
                            {item.observacoes.length > 30 
                              ? `${item.observacoes.substring(0, 30)}...` 
                              : item.observacoes}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => solicitarPin('edit', item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => solicitarPin('delete', item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* PIN Dialog */}
      <PinDialog
        isOpen={showPinDialog}
        onClose={() => {
          setShowPinDialog(false);
          setPendingAction(null);
          setSelectedItem(null);
        }}
        onConfirm={handlePinConfirmed}
        title="Confirmação Administrativa"
        description="Digite o PIN de administrador para realizar esta ação:"
      />
    </div>
  );
}
