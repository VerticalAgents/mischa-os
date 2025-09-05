
import { useState, useMemo } from "react";
import { useOptimizedReceitasData, ReceitaCompleta } from "@/hooks/useOptimizedReceitasData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, RefreshCw, Search } from "lucide-react";
import { ReceitaTableRow } from "./ReceitaTableRow";
import { ReceitasMetricasCards } from "./ReceitasMetricasCards";
import EditarReceitaModal from "./EditarReceitaModal";
import CriarReceitaModal from "./CriarReceitaModal";
import { GenerateFichaTecnicaDialog } from "@/components/fichas/GenerateFichaTecnicaDialog";

export default function ReceitasTab() {
  const { 
    receitas, 
    loading, 
    refreshing,
    isCacheValid,
    metricas,
    searchTerm,
    setSearchTerm,
    removerReceita, 
    duplicarReceita,
    refresh
  } = useOptimizedReceitasData();
  
  const [editandoReceita, setEditandoReceita] = useState<ReceitaCompleta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Handlers otimizados
  const handleRemoverReceita = async (id: string) => {
    await removerReceita(id);
  };

  const handleDuplicarReceita = async (receita: ReceitaCompleta) => {
    await duplicarReceita(receita);
  };

  const abrirEdicaoReceita = (receita: ReceitaCompleta) => {
    setEditandoReceita(receita);
    setIsEditModalOpen(true);
  };

  const fecharEdicaoReceita = () => {
    setEditandoReceita(null);
    setIsEditModalOpen(false);
  };

  const abrirCriacaoReceita = () => {
    setIsCreateModalOpen(true);
  };

  const fecharCriacaoReceita = () => {
    setIsCreateModalOpen(false);
  };

  const handleModalSuccess = () => {
    refresh();
  };

  const handleRefresh = () => {
    refresh();
  };

  // Memoizar as linhas da tabela para evitar re-renders desnecessários
  const receitasRows = useMemo(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando receitas...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (receitas.length === 0 && !searchTerm) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            Nenhuma receita cadastrada
          </TableCell>
        </TableRow>
      );
    }

    if (receitas.length === 0 && searchTerm) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            Nenhuma receita encontrada para "{searchTerm}"
          </TableCell>
        </TableRow>
      );
    }

    return receitas.map((receita) => (
      <ReceitaTableRow
        key={receita.id}
        receita={receita}
        onEdit={abrirEdicaoReceita}
        onRemove={handleRemoverReceita}
        onDuplicate={handleDuplicarReceita}
      />
    ));
  }, [receitas, loading, searchTerm]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Receitas Base</CardTitle>
                <CardDescription>Gerenciamento completo de receitas e seus custos</CardDescription>
              </div>
              {isCacheValid && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Dados em cache
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <GenerateFichaTecnicaDialog 
                receitas={receitas?.map(r => ({
                  id: r.id,
                  nome: r.nome,
                  rendimento_unidades: r.rendimento,
                  peso_total_g: r.peso_total,
                  custo_total: r.custo_total,
                  ingredientes: r.itens?.map(item => ({
                    id: item.id,
                    nome: item.nome_insumo,
                    unidade: item.unidade_medida,
                    quantidade: item.quantidade,
                    custo_total: item.custo_item
                  })) || [],
                  observacoes: r.descricao
                })) || []} 
              />
              <Button onClick={abrirCriacaoReceita}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Receita
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtro */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Filtrar receitas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Métricas rápidas */}
            {!loading && (
              <ReceitasMetricasCards metricas={metricas} loading={loading} />
            )}

            {/* Tabela de Receitas */}
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[100px]">Rendimento</TableHead>
                      <TableHead className="min-w-[120px]">Peso Total (g)</TableHead>
                      <TableHead className="min-w-[120px]">Custo Total (R$)</TableHead>
                      <TableHead className="min-w-[120px]">Custo Unitário (R$)</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitasRows}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <CriarReceitaModal
        isOpen={isCreateModalOpen}
        onClose={fecharCriacaoReceita}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de Edição */}
      <EditarReceitaModal
        receita={editandoReceita}
        isOpen={isEditModalOpen}
        onClose={fecharEdicaoReceita}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
