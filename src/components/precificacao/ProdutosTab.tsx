import { useState, useEffect } from "react";
import { useSupabaseProdutos, ProdutoCompleto } from "@/hooks/useSupabaseProdutos";
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
import { Trash2, Edit } from "lucide-react";
import EditarProdutoModal from "./EditarProdutoModal";

export default function ProdutosTab() {
  const { produtos, loading, carregarProdutos, removerProduto } = useSupabaseProdutos();
  const [editandoProduto, setEditandoProduto] = useState<ProdutoCompleto | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const abrirEdicaoProduto = (produto: ProdutoCompleto) => {
    setEditandoProduto(produto);
    setIsEditModalOpen(true);
  };

  const fecharEdicaoProduto = () => {
    setEditandoProduto(null);
    setIsEditModalOpen(false);
  };

  const handleRemoverProduto = async (produtoId: string) => {
    const confirmRemover = window.confirm("Tem certeza que deseja remover este produto?");
    if (confirmRemover) {
      await removerProduto(produtoId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Lista de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os produtos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidades/Produção</TableHead>
                <TableHead>Peso Total (g)</TableHead>
                <TableHead className="text-right">Custo Total (R$)</TableHead>
                <TableHead className="text-right">Custo Unitário (R$)</TableHead>
                <TableHead className="text-right">Preço Venda (R$)</TableHead>
                <TableHead className="text-right">Margem (%)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Carregando produtos...
                  </TableCell>
                </TableRow>
              ) : produtos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Nenhum produto cadastrado
                  </TableCell>
                </TableRow>
              ) : (
                produtos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>{produto.unidades_producao}</TableCell>
                    <TableCell>{produto.peso_total.toFixed(2)}g</TableCell>
                    <TableCell className="text-right">
                      R$ {produto.custo_total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {produto.custo_unitario.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {produto.preco_venda ? `R$ ${produto.preco_venda.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {produto.margem_lucro ? `${produto.margem_lucro.toFixed(1)}%` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrirEdicaoProduto(produto)}
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
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <EditarProdutoModal
        produto={editandoProduto}
        isOpen={isEditModalOpen}
        onClose={fecharEdicaoProduto}
        onSuccess={carregarProdutos}
      />
    </div>
  );
}
