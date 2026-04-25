
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
import { Plus, RefreshCw, Search, ChevronDown, ChevronRight } from "lucide-react";
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
  const [mostrarSemProduto, setMostrarSemProduto] = useState(false);

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

  // Separar receitas em duas listas: com produto ativo vinculado e sem
  const { receitasComProduto, receitasSemProduto } = useMemo(() => {
    const com: ReceitaCompleta[] = [];
    const sem: ReceitaCompleta[] = [];
    receitas.forEach((r) => {
      if ((r.produtos_ativos_vinculados ?? 0) > 0) com.push(r);
      else sem.push(r);
    });
    return { receitasComProduto: com, receitasSemProduto: sem };
  }, [receitas]);

  const renderRow = (receita: ReceitaCompleta) => (
    <ReceitaTableRow
      key={receita.id}
      receita={receita}
      onEdit={abrirEdicaoReceita}
      onRemove={handleRemoverReceita}
      onDuplicate={handleDuplicarReceita}
    />
  );

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
                    {loading && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Carregando receitas...
                          </div>
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && receitas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          {searchTerm
                            ? `Nenhuma receita encontrada para "${searchTerm}"`
                            : "Nenhuma receita cadastrada"}
                        </TableCell>
                      </TableRow>
                    )}

                    {!loading && receitasComProduto.length > 0 && (
                      <>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={6} className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Em produção ({receitasComProduto.length})
                          </TableCell>
                        </TableRow>
                        {receitasComProduto.map(renderRow)}
                      </>
                    )}

                    {!loading && receitasSemProduto.length > 0 && (
                      <>
                        <TableRow
                          className="bg-muted/20 hover:bg-muted/30 cursor-pointer"
                          onClick={() => setMostrarSemProduto((v) => !v)}
                        >
                          <TableCell colSpan={6} className="py-2">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {mostrarSemProduto ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                              Sem produto ativo vinculado ({receitasSemProduto.length})
                              <span className="ml-2 normal-case font-normal text-muted-foreground/70">
                                — clique para {mostrarSemProduto ? "ocultar" : "expandir"}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                        {mostrarSemProduto && receitasSemProduto.map(renderRow)}
                      </>
                    )}
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
