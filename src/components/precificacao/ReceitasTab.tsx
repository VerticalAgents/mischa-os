
import { useState, useMemo } from "react";
import { useOptimizedReceitasData, ReceitaCompleta } from "@/hooks/useOptimizedReceitasData";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";
import { ReceitaTableRow } from "./ReceitaTableRow";
import EditarReceitaModal from "./EditarReceitaModal";
import CriarReceitaModal from "./CriarReceitaModal";

export default function ReceitasTab() {
  const { 
    receitas, 
    loading, 
    removerReceita, 
    duplicarReceita,
    refresh
  } = useOptimizedReceitasData();
  
  const { insumos } = useSupabaseInsumos();
  
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

    if (receitas.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-8">
            Nenhuma receita cadastrada
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
  }, [receitas, loading]);

  return (
    <div className="space-y-6">
      {/* Lista de receitas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receitas Base Cadastradas</CardTitle>
              <CardDescription>
                Lista de todas as receitas base do sistema ({receitas.length} receitas)
              </CardDescription>
            </div>
            <Button onClick={abrirCriacaoReceita}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Receita
            </Button>
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
