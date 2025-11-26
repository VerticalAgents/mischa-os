
import { useState, useMemo } from "react";
import { useOptimizedProdutoData, ProdutoOptimizado } from "@/hooks/useOptimizedProdutoData";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseSubcategoriasProduto } from "@/hooks/useSupabaseSubcategoriasProduto";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  
  const { categorias } = useSupabaseCategoriasProduto();
  const { subcategorias } = useSupabaseSubcategoriasProduto();
  const { proporcoes } = useSupabaseProporoesPadrao();
  
  const [editandoProduto, setEditandoProduto] = useState<ProdutoOptimizado | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [filtrarRevendaPorProporcao, setFiltrarRevendaPorProporcao] = useState(true);

  // Funções para buscar nomes de categoria e subcategoria
  const getNomeCategoria = (categoriaId?: number) => {
    if (!categoriaId) return "Sem categoria";
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria?.nome || "Categoria não encontrada";
  };

  const getNomeSubcategoria = (subcategoriaId?: number) => {
    if (!subcategoriaId) return "";
    const subcategoria = subcategorias.find(sub => sub.id === subcategoriaId);
    return subcategoria?.nome || "";
  };

  // Handlers otimizados
  const handleRemoverProduto = async (id: string) => {
    setIsLoadingAction(true);
    await removerProduto(id);
    setIsLoadingAction(false);
  };

  const handleDuplicarProduto = async (produto: ProdutoOptimizado) => {
    setIsLoadingAction(true);
    await duplicarProduto(produto);
    setIsLoadingAction(false);
  };

  const abrirEdicaoProduto = (produto: ProdutoOptimizado) => {
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

  // Agrupar produtos por categoria
  const produtosPorCategoria = useMemo(() => {
    const grupos: Record<string, ProdutoOptimizado[]> = {};
    
    produtos.forEach(produto => {
      const nomeCategoria = getNomeCategoria(produto.categoria_id);
      if (!grupos[nomeCategoria]) {
        grupos[nomeCategoria] = [];
      }
      grupos[nomeCategoria].push(produto);
    });

    // Se filtro de Revenda Padrão está ativo, filtrar apenas produtos com proporção > 0
    if (filtrarRevendaPorProporcao && grupos["Revenda Padrão"]) {
      grupos["Revenda Padrão"] = grupos["Revenda Padrão"].filter(produto => {
        const proporcao = proporcoes.find(p => p.produto_id === produto.id);
        return proporcao && proporcao.percentual > 0;
      });
    }

    return grupos;
  }, [produtos, categorias, filtrarRevendaPorProporcao, proporcoes]);

  // Função para renderizar tabela de produtos de uma categoria
  const renderTabelaCategoria = (nomeCategoria: string, produtosCategoria: ProdutoOptimizado[]) => {
    if (produtosCategoria.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
            Nenhum produto nesta categoria
          </TableCell>
        </TableRow>
      );
    }

    return produtosCategoria.map((produto) => (
      <ProdutoTableRow
        key={produto.id}
        produto={produto}
        getNomeCategoria={getNomeCategoria}
        getNomeSubcategoria={getNomeSubcategoria}
        onEditar={abrirEdicaoProduto}
        onRemover={handleRemoverProduto}
        onDuplicar={handleDuplicarProduto}
        isLoadingAction={isLoadingAction}
      />
    ));
  };

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
                      {metricas.margemMedia.toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">Margem Média</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Produtos agrupados por categoria */}
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Carregando produtos...
                </div>
              ) : Object.keys(produtosPorCategoria).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? `Nenhum produto encontrado para "${searchTerm}"` : "Nenhum produto cadastrado"}
                </div>
              ) : (
                Object.entries(produtosPorCategoria).map(([nomeCategoria, produtosCategoria]) => (
                  <Card key={nomeCategoria}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{nomeCategoria}</CardTitle>
                          <CardDescription>{produtosCategoria.length} produto(s)</CardDescription>
                        </div>
                        
                        {/* Toggle para filtrar Revenda Padrão por proporção */}
                        {nomeCategoria === "Revenda Padrão" && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="filtrar-proporcao"
                              checked={filtrarRevendaPorProporcao}
                              onCheckedChange={setFiltrarRevendaPorProporcao}
                            />
                            <Label htmlFor="filtrar-proporcao" className="text-sm cursor-pointer">
                              Apenas com proporção padrão
                            </Label>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full overflow-x-auto">
                        <div className="rounded-md border min-w-full">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="min-w-[150px]">Nome</TableHead>
                                <TableHead className="min-w-[100px]">Categoria</TableHead>
                                <TableHead className="min-w-[120px]">Subcategoria</TableHead>
                                <TableHead className="min-w-[120px]">Custo Unitário (R$)</TableHead>
                                <TableHead className="min-w-[120px]">Preço Venda (R$)</TableHead>
                                <TableHead className="min-w-[100px]">Margem (%)</TableHead>
                                <TableHead className="min-w-[80px]">Status</TableHead>
                                <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {renderTabelaCategoria(nomeCategoria, produtosCategoria)}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
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
