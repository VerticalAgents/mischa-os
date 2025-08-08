
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import { useSupabaseHistoricoProducao } from '@/hooks/useSupabaseHistoricoProducao';
import { HistoricoProducaoModal } from './HistoricoProducaoModal';
import { ConfirmacaoProducaoButton } from './ConfirmacaoProducaoButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function HistoricoProducao() {
  const { historico, loading, adicionarRegistro, editarRegistro, removerRegistro, carregarHistorico } = useSupabaseHistoricoProducao();
  const [modalAberto, setModalAberto] = useState(false);
  const [registroEditando, setRegistroEditando] = useState<any>(null);

  const handleNovoRegistro = () => {
    setRegistroEditando(null);
    setModalAberto(true);
  };

  const handleEditarRegistro = (registro: any) => {
    setRegistroEditando({
      ...registro,
      dataProducao: new Date(registro.data_producao)
    });
    setModalAberto(true);
  };

  const handleSalvarRegistro = async (dados: any) => {
    const registro = {
      data_producao: dados.dataProducao.toISOString().split('T')[0],
      produto_id: dados.produtoId,
      produto_nome: dados.produtoNome,
      formas_producidas: dados.formasProducidas,
      unidades_calculadas: dados.unidadesCalculadas || dados.unidadesPrevistas,
      turno: dados.turno,
      observacoes: dados.observacoes,
      origem: dados.origem,
      
      // Novos campos para snapshot
      rendimento_usado: dados.rendimentoUsado,
      unidades_previstas: dados.unidadesPrevistas,
      status: dados.status
    };

    if (registroEditando) {
      await editarRegistro(registroEditando.id, registro);
    } else {
      await adicionarRegistro(registro);
    }
  };

  const handleRemoverRegistro = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este registro?')) {
      await removerRegistro(id);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Confirmado':
        return <Badge className="bg-green-500 hover:bg-green-600">Confirmado</Badge>;
      case 'Registrado':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">Registrado</Badge>;
      default:
        return <Badge variant="secondary">Indefinido</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">Carregando histórico...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Produção
            </CardTitle>
          </div>
          <Button onClick={handleNovoRegistro} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Novo Registro
          </Button>
        </CardHeader>

        <CardContent>
          {historico.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
              <p>Comece criando seu primeiro registro de produção.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Formas</TableHead>
                  <TableHead>Rendimento Usado</TableHead>
                  <TableHead>Unidades Previstas</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell>
                      {format(new Date(registro.data_producao), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {registro.produto_nome}
                    </TableCell>
                    <TableCell>{registro.formas_producidas}</TableCell>
                    <TableCell>
                      {registro.rendimento_usado ? `${registro.rendimento_usado}/forma` : '—'}
                    </TableCell>
                    <TableCell>
                      {registro.unidades_previstas || registro.unidades_calculadas}
                    </TableCell>
                    <TableCell>{registro.turno || '—'}</TableCell>
                    <TableCell>
                      {getStatusBadge(registro.status)}
                      {registro.confirmado_em && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(registro.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <ConfirmacaoProducaoButton
                          registroId={registro.id}
                          produtoNome={registro.produto_nome}
                          formasProducidas={registro.formas_producidas}
                          unidadesPrevistas={registro.unidades_previstas || registro.unidades_calculadas}
                          status={registro.status || 'Registrado'}
                          onConfirmado={carregarHistorico}
                        />
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditarRegistro(registro)}
                          disabled={registro.status === 'Confirmado'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoverRegistro(registro.id)}
                          disabled={registro.status === 'Confirmado'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <HistoricoProducaoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={handleSalvarRegistro}
        registro={registroEditando}
      />
    </div>
  );
}
