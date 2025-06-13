import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseProdutos, ProdutoCompleto } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseSubcategoriasProduto } from "@/hooks/useSupabaseSubcategoriasProduto";
import EditarProdutoModal from "./EditarProdutoModal";
import CriarProdutoModal from "./CriarProdutoModal";
import { Edit, Plus, Search, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ProdutosTab() {
  const { produtos, loading, carregarProdutos, carregarProdutoCompleto, removerProduto, duplicarProduto } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { subcategorias } = useSupabaseSubcategoriasProduto();
  const [filtro, setFiltro] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoCompleto | null>(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [loadingProdutoCompleto, setLoadingProdutoCompleto] = useState(false);
  const { toast } = useToast();

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(filtro.toLowerCase())
  );

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

  const handleEditarProduto = async (produto: any) => {
    setLoadingProdutoCompleto(true);
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
      setLoadingProdutoCompleto(false);
    }
  };

  const handleRemoverProduto = async (produtoId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      await removerProduto(produtoId);
    }
  };

  const handleDuplicarProduto = async (produto: any) => {
    try {
      await duplicarProduto(produto);
      toast({
        title: "Produto duplicado",
        description: "Produto duplicado com sucesso como ativo",
      });
      carregarProdutos();
    } catch (error) {
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar o produto",
        variant: "destructive",
      });
    }
  };

  const handleModalSuccess = () => {
    carregarProdutos();
    // Recarregar o produto selecionado se o modal estiver aberto
    if (produtoSelecionado && modalEditarAberto) {
      carregarProdutoCompleto(produtoSelecionado.id).then(produtoAtualizado => {
        if (produtoAtualizado) {
          setProdutoSelecionado(produtoAtualizado);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Produtos Finais</CardTitle>
            <Button onClick={() => setModalCriarAberto(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
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

            {/* Tabela de Produtos - Agora responsiva */}
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[120px]">Categoria</TableHead>
                      <TableHead className="min-w-[120px]">Subcategoria</TableHead>
                      <TableHead className="min-w-[100px]">Unidades/Produção</TableHead>
                      <TableHead className="min-w-[100px]">Custo Unitário</TableHead>
                      <TableHead className="min-w-[100px]">Preço Venda</TableHead>
                      <TableHead className="min-w-[80px]">Margem</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          Carregando produtos...
                        </TableCell>
                      </TableRow>
                    ) : produtosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center">
                          Nenhum produto encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      produtosFiltrados.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getNomeCategoria(produto.categoria_id)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getNomeSubcategoria(produto.subcategoria_id) ? (
                              <Badge variant="secondary">
                                {getNomeSubcategoria(produto.subcategoria_id)}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>{produto.unidades_producao}</TableCell>
                          <TableCell>R$ {produto.custo_unitario.toFixed(2)}</TableCell>
                          <TableCell>
                            {produto.preco_venda ? `R$ ${produto.preco_venda.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={produto.margem_lucro > 20 ? "default" : produto.margem_lucro > 10 ? "secondary" : "destructive"}
                            >
                              {produto.margem_lucro.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={produto.ativo ? "default" : "secondary"}>
                              {produto.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDuplicarProduto(produto)}
                                title="Duplicar produto"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarProduto(produto)}
                                disabled={loadingProdutoCompleto}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoverProduto(produto.id)}
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
        onSuccess={carregarProdutos}
      />
    </div>
  );
}
