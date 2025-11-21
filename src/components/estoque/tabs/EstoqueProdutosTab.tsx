
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Settings } from "lucide-react";
import { useEstoqueComExpedicao } from "@/hooks/useEstoqueComExpedicao";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import MovimentacaoEstoqueModal from "../MovimentacaoEstoqueModal";
import BaixaEstoqueModal from "../BaixaEstoqueModal";
import HistoricoMovimentacoes from "../HistoricoMovimentacoes";
import CalculoEstoqueModal from "../CalculoEstoqueModal";
import CategoriaEstoqueGroup from "../CategoriaEstoqueGroup";

export default function EstoqueProdutosTab() {
  const { produtos, loading, timeoutError, carregarSaldos, forcarRecarregamento } = useEstoqueComExpedicao();
  const { movimentacoes, loading: loadingMovimentacoes, adicionarMovimentacao } = useMovimentacoesEstoqueProdutos();
  const { categorias } = useSupabaseCategoriasProduto();
  const { proporcoes } = useSupabaseProporoesPadrao();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [mostrarSaldoTotal, setMostrarSaldoTotal] = useState(false);
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [modalCalculos, setModalCalculos] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<{id: string, nome: string} | null>(null);
  const [showHistorico, setShowHistorico] = useState<string | null>(null);

  // Filtrar produtos por busca
  const produtosFiltrados = useMemo(() => 
    produtos.filter(produto =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [produtos, searchTerm]
  );

  // Agrupar produtos por categoria
  const produtosPorCategoria = useMemo(() => {
    const grupos: Record<string, typeof produtosFiltrados> = {};
    
    produtosFiltrados.forEach(produto => {
      const categoriaId = produto.categoria_id?.toString() || 'sem-categoria';
      if (!grupos[categoriaId]) {
        grupos[categoriaId] = [];
      }
      grupos[categoriaId].push(produto);
    });
    
    return grupos;
  }, [produtosFiltrados]);

  // Ordenar categorias: Revenda Padrão primeiro, depois outras, depois Sem Categoria
  const categoriasOrdenadas = useMemo(() => {
    const cats = [...categorias];
    const revendaPadrao = cats.find(c => c.nome === "Revenda Padrão");
    const outras = cats.filter(c => c.nome !== "Revenda Padrão");
    
    const resultado = [];
    if (revendaPadrao && produtosPorCategoria[revendaPadrao.id.toString()]) {
      resultado.push(revendaPadrao);
    }
    outras.forEach(cat => {
      if (produtosPorCategoria[cat.id.toString()]) {
        resultado.push(cat);
      }
    });
    
    // Adicionar categoria "Sem Categoria" se houver produtos
    if (produtosPorCategoria['sem-categoria']) {
      resultado.push({ id: 0, nome: "Sem Categoria", ativo: true, created_at: "", updated_at: "" });
    }
    
    return resultado;
  }, [categorias, produtosPorCategoria]);

  // Entrada rápida
  const entradaRapida = async (produtoId: string, quantidade: number) => {
    const sucesso = await adicionarMovimentacao({
      produto_id: produtoId,
      tipo: 'entrada',
      quantidade: Math.abs(quantidade),
      data_movimentacao: new Date().toISOString(),
      observacao: `Entrada rápida de ${Math.abs(quantidade)} unidades`
    });

    if (sucesso) {
      await carregarSaldos();
    }
  };

  const handleModalMovimentacao = (produto: any) => {
    setProdutoSelecionado({ id: produto.id, nome: produto.nome });
    setModalMovimentacao(true);
  };

  const handleModalBaixa = (produto: any) => {
    setProdutoSelecionado({ id: produto.id, nome: produto.nome });
    setModalBaixa(true);
  };

  const handleCloseModal = () => {
    setModalMovimentacao(false);
    setModalBaixa(false);
    setProdutoSelecionado(null);
    carregarSaldos();
  };

  const getStatusEstoque = (saldo: number) => {
    if (saldo <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (saldo <= 10) return { variant: "secondary" as const, label: "Baixo" };
    if (saldo <= 50) return { variant: "outline" as const, label: "Médio" };
    return { variant: "default" as const, label: "Alto" };
  };

  const movimentacoesProdutoSelecionado = showHistorico 
    ? movimentacoes.filter(mov => mov.produto_id === showHistorico)
    : [];

  if (timeoutError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="text-destructive">⚠️</div>
            <div className="text-center">
              <p className="text-destructive font-medium">Erro no carregamento</p>
              <p className="text-sm text-muted-foreground">O carregamento demorou mais que o esperado</p>
            </div>
            <Button onClick={forcarRecarregamento} variant="outline">
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <div className="text-center">
              <p>Carregando dados de estoque...</p>
              <p className="text-sm text-muted-foreground">Aguarde, sincronizando informações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e busca */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2 border rounded-lg px-4 py-2">
          <Switch 
            checked={mostrarSaldoTotal}
            onCheckedChange={setMostrarSaldoTotal}
            id="mostrar-saldo-total"
          />
          <Label htmlFor="mostrar-saldo-total" className="cursor-pointer whitespace-nowrap text-sm">
            Mostrar Saldo Total
          </Label>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setModalCalculos(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Cálculo
        </Button>
      </div>

      {/* Produtos agrupados por categoria */}
      <div className="space-y-4">
        {categoriasOrdenadas.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
            </CardContent>
          </Card>
        ) : (
          categoriasOrdenadas.map((categoria) => {
            const categoriaKey = categoria.id === 0 ? 'sem-categoria' : categoria.id.toString();
            const produtosCategoria = produtosPorCategoria[categoriaKey] || [];
            
            return (
              <CategoriaEstoqueGroup
                key={categoriaKey}
                categoria={categoria}
                produtos={produtosCategoria}
                proporcoes={proporcoes}
                mostrarSaldoTotal={mostrarSaldoTotal}
                onEntradaRapida={entradaRapida}
                onAbrirMovimentacao={handleModalMovimentacao}
                onAbrirBaixa={handleModalBaixa}
                onVerHistorico={(produtoId) => setShowHistorico(showHistorico === produtoId ? null : produtoId)}
                getStatusEstoque={getStatusEstoque}
              />
            );
          })
        )}
      </div>

      {/* Histórico do produto selecionado */}
      {showHistorico && (
        <HistoricoMovimentacoes
          itemId={showHistorico}
          itemNome={produtos.find(p => p.id === showHistorico)?.nome || "Produto"}
          tipoItem="produto"
          movimentacoes={movimentacoesProdutoSelecionado}
          loading={loadingMovimentacoes}
        />
      )}

      {/* Modais */}
      {produtoSelecionado && (
        <>
          <MovimentacaoEstoqueModal
            isOpen={modalMovimentacao}
            onClose={handleCloseModal}
            itemId={produtoSelecionado.id}
            itemNome={produtoSelecionado.nome}
            tipoItem="produto"
            onSuccess={handleCloseModal}
          />
          
          <BaixaEstoqueModal
            isOpen={modalBaixa}
            onClose={handleCloseModal}
            itemId={produtoSelecionado.id}
            itemNome={produtoSelecionado.nome}
            tipoItem="produto"
            saldoAtual={produtos.find(p => p.id === produtoSelecionado.id)?.saldoAtual || 0}
            onSuccess={handleCloseModal}
          />
        </>
      )}

      {/* Modal de Cálculo */}
      <CalculoEstoqueModal
        isOpen={modalCalculos}
        onClose={() => setModalCalculos(false)}
      />
    </div>
  );
}
