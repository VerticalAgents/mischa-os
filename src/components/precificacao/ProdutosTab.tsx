
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOptimizedProdutoData, ProdutoOptimizado } from "@/hooks/useOptimizedProdutoData";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseSubcategoriasProduto } from "@/hooks/useSupabaseSubcategoriasProduto";
import { ProdutoTableRow } from "./ProdutoTableRow";
import EditarProdutoModal from "./EditarProdutoModal";
import CriarProdutoModal from "./CriarProdutoModal";
import { Plus, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProdutosTab() {
  const { 
    produtos: produtosOtimizados, 
    loading: loadingOtimizado, 
    recarregar,
    invalidateCache,
    isCacheValid 
  } = useOptimizedProdutoData();
  
  const { 
    carregarProdutoCompleto, 
    removerProduto, 
    duplicarProduto 
  } = useSupabaseProdutos();
  
  const { categorias } = useSupabaseCategoriasProduto();
  const { subcategorias } = useSupabaseSubcategoriasProduto();
  
  const [filtro, setFiltro] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const { toast } = useToast();

  const produtosFiltrados = useMemo(() => {
    if (!filtro) return produtosOtimizados;
    return produtosOtimizados.filter(produto =>
      produto.nome.toLowerCase().includes(filtro.toLowerCase())
    );
  }, [produtosOtimizados, filtro]);

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

  const handleEditarProduto = async (produto: ProdutoOptimizado) => {
    setLoadingAction(true);
    try {
      const produtoCompleto = await carregarProdutoCompleto(produto.id);
      if (produtoCompleto) {
        setProdutoSelecionado(produtoCompleto);
        setModalEditarAberto(true);
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do produto",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao carregar produto completo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do produto",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRemoverProduto = async (produtoId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      setLoadingAction(true);
      try {
        const sucesso = await removerProduto(produtoId);
        if (sucesso) {
          invalidateCache(); // Invalidar cache para recarregar dados
          recarregar(); // Recarregar dados otimizados
        }
      } finally {
        setLoadingAction(false);
      }
    }
  };

  const handleDuplicarProduto = async (produto: ProdutoOptimizado) => {
    setLoadingAction(true);
    try {
      const resultado = await duplicarProduto(produto);
      if (resultado) {
        toast({
          title: "Produto duplicado",
          description: "Produto duplicado com sucesso como ativo",
        });
        invalidateCache();
        recarregar();
      }
    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar o produto",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleModalSuccess = () => {
    invalidateCache();
    recarregar();
    
    // Recarregar o produto selecionado se o modal estiver aberto
    if (produtoSelecionado && modalEditarAberto) {
      carregarProdutoCompleto(produtoSelecionado.id).then(produtoAtualizado => {
        if (produtoAtualizado) {
          setProdutoSelecionado(produtoAtualizado);
        }
      });
    }
  };

  const handleRefresh = () => {
    invalidateCache();
    recarregar();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>Produtos Finais</CardTitle>
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
                disabled={loadingOtimizado}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingOtimizado ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button onClick={() => setModalCriarAberto(true)}>
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
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Métricas rápidas */}
            {!loadingOtimizado && produtosOtimizados.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{produtosOtimizados.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Produtos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {produtosOtimizados.filter(p => p.ativo).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {produtosOtimizados.filter(p => p.componentes_count > 0).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Com Componentes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {produtosOtimizados.filter(p => p.margem_real < 10).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Margem Baixa</div>
                </div>
              </div>
            )}

            {/* Tabela de Produtos - Agora otimizada */}
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[120px]">Categoria</TableHead>
                      <TableHead className="min-w-[120px]">Subcategoria</TableHead>
                      <TableHead className="min-w-[100px]">Custo Unitário</TableHead>
                      <TableHead className="min-w-[100px]">Preço Venda</TableHead>
                      <TableHead className="min-w-[80px]">Margem</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingOtimizado ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Carregando produtos otimizado...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : produtosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          {filtro ? "Nenhum produto encontrado com o filtro aplicado" : "Nenhum produto encontrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <ProdutoTableRow
                          key={produto.id}
                          produto={produto}
                          getNomeCategoria={getNomeCategoria}
                          getNomeSubcategoria={getNomeSubcategoria}
                          onEditar={handleEditarProduto}
                          onDuplicar={handleDuplicarProduto}
                          onRemover={handleRemoverProduto}
                          isLoadingAction={loadingAction}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Editar Produto */}
      <EditarProdutoModal
        produto={produtoSelecionado}
        isOpen={modalEditarAberto}
        onClose={() => {
          setModalEditarAberto(false);
          setProdutoSelecionado(null);
        }}
        onSuccess={handleModalSuccess}
      />

      {/* Modal Criar Produto */}
      <CriarProdutoModal
        isOpen={modalCriarAberto}
        onClose={() => setModalCriarAberto(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
