
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
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
      {/* Header com botão de atualizar e indicador de cache */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Receitas Base</h2>
          <p className="text-muted-foreground">
            Gerencie as receitas base do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isCacheValid && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
              Dados em cache
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Atualizando...' : 'Atualizar'}
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <ReceitasMetricasCards metricas={metricas} loading={loading} />

      {/* Filtro de busca */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar receitas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={abrirCriacaoReceita} className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Receita
        </Button>
      </div>

      {/* Lista de receitas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receitas Cadastradas</CardTitle>
              <CardDescription>
                {searchTerm ? (
                  <>Mostrando {receitas.length} receita{receitas.length !== 1 ? 's' : ''} para "{searchTerm}"</>
                ) : (
                  <>Lista de todas as receitas base ({metricas.totalReceitas} receitas)</>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>Peso Total (g)</TableHead>
                <TableHead className="text-right">Custo Total (R$)</TableHead>
                <TableHead className="text-right">Custo Unitário (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receitasRows}
            </TableBody>
          </Table>
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
