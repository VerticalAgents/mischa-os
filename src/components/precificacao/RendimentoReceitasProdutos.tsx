
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, ExternalLink, Check, X } from "lucide-react";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RendimentoReceitasProdutos() {
  const {
    receitas,
    loading: loadingReceitas
  } = useSupabaseReceitas();
  const {
    produtos,
    loading: loadingProdutos
  } = useSupabaseProdutos();
  const {
    rendimentos,
    loading: loadingRendimentos,
    salvarRendimento,
    removerRendimento,
    obterRendimentoPorReceita,
    obterRendimento
  } = useRendimentosReceitaProduto();
  
  const [produtoSelecionado, setProdutoSelecionado] = useState<Record<string, string>>({});
  const [rendimentoEditando, setRendimentoEditando] = useState<string | null>(null);
  const [valorRendimento, setValorRendimento] = useState<string>("");

  // Obter produtos disponíveis para adicionar a uma receita
  const getProdutosDisponiveis = (receitaId: string) => {
    const rendimentosReceita = obterRendimentoPorReceita(receitaId);
    const produtosVinculados = rendimentosReceita.map(r => r.produto_id);
    return produtos.filter(p => !produtosVinculados.includes(p.id));
  };

  // Obter categoria do produto
  const getCategoriaProduto = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    return produto?.categoria_id ? `Categoria ${produto.categoria_id}` : "Sem categoria";
  };

  // Adicionar produto à receita
  const adicionarProdutoReceita = async (receitaId: string) => {
    const produtoId = produtoSelecionado[receitaId];
    if (!produtoId) return;
    
    const sucesso = await salvarRendimento(receitaId, produtoId, 1.0);
    if (sucesso) {
      setProdutoSelecionado(prev => ({
        ...prev,
        [receitaId]: ''
      }));
    }
  };

  // Iniciar edição do rendimento
  const iniciarEdicaoRendimento = (receitaId: string, produtoId: string, rendimentoAtual: number) => {
    const chave = `${receitaId}-${produtoId}`;
    setRendimentoEditando(chave);
    setValorRendimento(rendimentoAtual.toString());
  };

  // Cancelar edição
  const cancelarEdicao = () => {
    setRendimentoEditando(null);
    setValorRendimento("");
  };

  // Salvar rendimento editado
  const salvarRendimentoEditado = async (receitaId: string, produtoId: string) => {
    const novoRendimento = parseFloat(valorRendimento);
    
    if (isNaN(novoRendimento) || novoRendimento <= 0) {
      alert("Por favor, insira um valor válido maior que zero");
      return;
    }

    const sucesso = await salvarRendimento(receitaId, produtoId, novoRendimento);
    if (sucesso) {
      setRendimentoEditando(null);
      setValorRendimento("");
    }
  };

  // Remover produto da receita
  const removerProdutoReceita = async (receitaId: string, produtoId: string) => {
    const rendimento = obterRendimento(receitaId, produtoId);
    if (rendimento && window.confirm('Tem certeza que deseja remover este produto da receita?')) {
      await removerRendimento(rendimento.id);
    }
  };

  if (loadingReceitas || loadingProdutos || loadingRendimentos) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Carregando dados...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!receitas.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              Nenhuma receita encontrada. Cadastre receitas primeiro na aba "Receitas Base".
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Rendimento de Receitas por Produto
          </CardTitle>
          <p className="text-sm text-muted-foreground text-left">
            Configure quantas unidades de cada produto são geradas por receita. 
            Essa informação será usada no cálculo de produção.
          </p>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        {receitas.map(receita => {
          const rendimentosReceita = obterRendimentoPorReceita(receita.id);
          const produtosDisponiveis = getProdutosDisponiveis(receita.id);
          
          return (
            <AccordionItem key={receita.id} value={receita.id}>
              <Card>
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center justify-between w-full mr-4">
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{receita.nome}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0" 
                        onClick={(e) => {
                          e.stopPropagation();
                          // Aqui poderia abrir modal de edição da receita
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {rendimentosReceita.length} produto(s) vinculado(s)
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <CardContent className="pt-0">
                    {/* Adicionar novo produto */}
                    {produtosDisponiveis.length > 0 && (
                      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">
                          Adicionar Produto à Receita
                        </Label>
                        <div className="flex gap-2">
                          <Select 
                            value={produtoSelecionado[receita.id] || ''} 
                            onValueChange={(value) => setProdutoSelecionado(prev => ({
                              ...prev,
                              [receita.id]: value
                            }))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                              {produtosDisponiveis.map(produto => (
                                <SelectItem key={produto.id} value={produto.id}>
                                  {produto.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={() => adicionarProdutoReceita(receita.id)}
                            disabled={!produtoSelecionado[receita.id]}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Tabela de produtos vinculados */}
                    {rendimentosReceita.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="w-48">Unidades por Receita</TableHead>
                            <TableHead className="w-20">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rendimentosReceita.map(rendimento => {
                            const produto = produtos.find(p => p.id === rendimento.produto_id);
                            const chaveEdicao = `${receita.id}-${rendimento.produto_id}`;
                            const estaEditando = rendimentoEditando === chaveEdicao;
                            
                            return (
                              <TableRow key={rendimento.id}>
                                <TableCell className="font-medium">
                                  {produto?.nome || 'Produto não encontrado'}
                                </TableCell>
                                <TableCell>
                                  {getCategoriaProduto(rendimento.produto_id)}
                                </TableCell>
                                <TableCell>
                                  {estaEditando ? (
                                    <div className="flex items-center gap-2">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={valorRendimento}
                                        onChange={(e) => setValorRendimento(e.target.value)}
                                        className="w-24"
                                        placeholder="Ex: 1.5"
                                        autoFocus
                                      />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => salvarRendimentoEditado(receita.id, rendimento.produto_id)}
                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                      >
                                        <Check className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={cancelarEdicao}
                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      className="h-8 px-2 justify-start font-normal"
                                      onClick={() => iniciarEdicaoRendimento(receita.id, rendimento.produto_id, rendimento.rendimento)}
                                    >
                                      {rendimento.rendimento} unidades
                                    </Button>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removerProdutoReceita(receita.id, rendimento.produto_id)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Nenhum produto vinculado a esta receita</p>
                        <p className="text-sm">Use o formulário acima para adicionar produtos</p>
                      </div>
                    )}
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
