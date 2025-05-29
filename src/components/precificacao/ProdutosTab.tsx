
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
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import EditarProdutoModal from "./EditarProdutoModal";
import CriarProdutoModal from "./CriarProdutoModal";
import { Edit, Plus, Search, Trash2 } from "lucide-react";

export default function ProdutosTab() {
  const { produtos, loading, carregarProdutos, removerProduto } = useSupabaseProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const [filtro, setFiltro] = useState("");
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalCriarAberto, setModalCriarAberto] = useState(false);

  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(filtro.toLowerCase())
  );

  const getNomeCategoria = (categoriaId?: number) => {
    if (!categoriaId) return "Sem categoria";
    const categoria = categorias.find(cat => cat.id === categoriaId);
    return categoria?.nome || "Categoria não encontrada";
  };

  const handleEditarProduto = (produto: any) => {
    setProdutoSelecionado(produto);
    setModalEditarAberto(true);
  };

  const handleRemoverProduto = async (produtoId: string) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      await removerProduto(produtoId);
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

            {/* Tabela de Produtos */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidades/Produção</TableHead>
                    <TableHead>Custo Unitário</TableHead>
                    <TableHead>Preço Venda</TableHead>
                    <TableHead>Margem</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        Carregando produtos...
                      </TableCell>
                    </TableRow>
                  ) : produtosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
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
                              onClick={() => handleEditarProduto(produto)}
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
        onSuccess={carregarProdutos}
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
