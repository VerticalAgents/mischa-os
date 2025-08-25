
import { useState, useMemo } from "react";
import { useOptimizedProdutoData, ProdutoCompleto } from "@/hooks/useOptimizedProdutoData";
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
import { ProdutoTableRow } from "./ProdutoTableRow";
import EditarProdutoModal from "./EditarProdutoModal";
import CriarProdutoModal from "./CriarProdutoModal";

export default function ProdutosTab() {
  const { 
    produtos, 
    loading, 
    refreshing,
    isCacheValid,
    metricas,
    searchTerm,
    setSearchTerm,
    removerProduto, 
    duplicarProduto,
    refresh
  } = useOptimizedProdutoData();
  
  const [editandoProduto, setEditandoProduto] = useState<ProdutoCompleto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Handlers otimizados
  const handleRemoverProduto = async (id: string) => {
    await removerProduto(id);
  };

  const handleDuplicarProduto = async (produto: ProdutoCompleto) => {
    await duplicarProduto(produto);
  };

  const abrirEdicaoProduto = (produto: ProdutoCompleto) => {
    setEditandoProduto(produto);
    setIsEditModalOpen(true);
  };

  const fecharEdicaoProduto = () => {
    setEditandoProduto(null);
    setIsEditModalOpen(false);
  };

  const abrirCriacaoProduto = () => {
    setIsCreateModalOpen(true);
  };

  const fecharCriacaoProduto = () => {
    setIsCreateModalOpen(false);
  };

  const handleModalSuccess = () => {
    refresh();
  };

  const handleRefresh = () => {
    refresh();
  };

  // Memoizar as linhas da tabela para evitar re-renders desnecessários
  const produtosRows = useMemo(() => {
    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Carregando produtos...
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (produtos.length === 0 && !searchTerm) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-8">
            Nenhum produto cadastrado
          </TableCell>
        </TableRow>
      );
    }

    if (produtos.length === 0 && searchTerm) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="text-center py-8">
            Nenhum produto encontrado para "{searchTerm}"
          </TableCell>
        </TableRow>
      );
    }

    return produtos.map((produto) => (
      <ProdutoTableRow
        key={produto.id}
        produto={produto}
        onEdit={abrirEdicaoProduto}
        onRemove={handleRemoverProduto}
        onDuplicate={handleDuplicarProduto}
      />
    ));
  }, [produtos, loading, searchTerm]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Produtos Finais</CardTitle>
                <CardDescription>Gestão completa de produtos e precificação</CardDescription>
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
              <Button onClick={abrirCriacaoProduto}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
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
                placeholder="Filtrar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Métricas rápidas */}
            {!loading && metricas && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{metricas.totalProdutos}</div>
                    <p className="text-xs text-muted-foreground">Total de Produtos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{metricas.produtosAtivos}</div>
                    <p className="text-xs text-muted-foreground">Produtos Ativos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {metricas.custoMedio.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Custo Médio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      R$ {metricas.margemMedia.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Margem Média</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tabela de Produtos */}
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[100px]">Categoria</TableHead>
                      <TableHead className="min-w-[120px]">Peso Líquido (g)</TableHead>
                      <TableHead className="min-w-[120px]">Custo Total (R$)</TableHead>
                      <TableHead className="min-w-[120px]">Preço Sugerido (R$)</TableHead>
                      <TableHead className="min-w-[100px]">Margem (%)</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtosRows}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <CriarProdutoModal
        isOpen={isCreateModalOpen}
        onClose={fecharCriacaoProduto}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de Edição */}
      <EditarProdutoModal
        produto={editandoProduto}
        isOpen={isEditModalOpen}
        onClose={fecharEdicaoProduto}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
