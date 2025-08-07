
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, ExternalLink } from "lucide-react";
import { useSupabaseReceitas } from "@/hooks/useSupabaseReceitas";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useRendimentosReceitaProduto } from "@/hooks/useRendimentosReceitaProduto";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RendimentoReceitasProdutos() {
  const { receitas, loading: loadingReceitas } = useSupabaseReceitas();
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const {
    rendimentos,
    loading: loadingRendimentos,
    salvarRendimento,
    removerRendimento,
    obterRendimentoPorReceita,
    obterRendimento
  } = useRendimentosReceitaProduto();

  const [produtoSelecionado, setProdutoSelecionado] = useState<Record<string, string>>({});
  const [rendimentoTemp, setRendimentoTemp] = useState<Record<string, number>>({});

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
      setProdutoSelecionado(prev => ({ ...prev, [receitaId]: '' }));
    }
  };

  // Atualizar rendimento
  const atualizarRendimento = async (receitaId: string, produtoId: string, novoRendimento: number) => {
    if (novoRendimento <= 0) {
      return;
    }
    await salvarRendimento(receitaId, produtoId, novoRendimento);
  };

  // Remover produto da receita
  const removerProdutoReceita = async (receitaId: string, produtoId: string) => {
    const rendimento = obterRendimento(receitaId, produtoId);
    if (rendimento) {
      await removerRendimento(rendimento.id);
    }
  };

  const handleRendimentoChange = (receitaId: string, produtoId: string, valor: string) => {
    const chave = `${receitaId}-${produtoId}`;
    const numero = parseFloat(valor);
    if (!isNaN(numero) && numero > 0) {
      setRendimentoTemp(prev => ({ ...prev, [chave]: numero }));
    }
  };

  const handleRendimentoBlur = async (receitaId: string, produtoId: string) => {
    const chave = `${receitaId}-${produtoId}`;
    const novoRendimento = rendimentoTemp[chave];
    if (novoRendimento && novoRendimento > 0) {
      await atualizarRendimento(receitaId, produtoId, novoRendimento);
      setRendimentoTemp(prev => {
        const novo = { ...prev };
        delete novo[chave];
        return novo;
      });
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
          <p className="text-sm text-muted-foreground">
            Configure quantas unidades de cada produto são geradas por receita. 
            Essa informação será usada no cálculo de produção.
          </p>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        {receitas.map((receita) => {
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
                            onValueChange={(value) => 
                              setProdutoSelecionado(prev => ({ ...prev, [receita.id]: value }))
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Selecione um produto..." />
                            </SelectTrigger>
                            <SelectContent>
                              {produtosDisponiveis.map((produto) => (
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
                          {rendimentosReceita.map((rendimento) => {
                            const produto = produtos.find(p => p.id === rendimento.produto_id);
                            const chave = `${receita.id}-${rendimento.produto_id}`;
                            const valorTemp = rendimentoTemp[chave];
                            
                            return (
                              <TableRow key={rendimento.id}>
                                <TableCell className="font-medium">
                                  {produto?.nome || 'Produto não encontrado'}
                                </TableCell>
                                <TableCell>
                                  {getCategoriaProduto(rendimento.produto_id)}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={valorTemp !== undefined ? valorTemp : rendimento.rendimento}
                                    onChange={(e) => 
                                      handleRendimentoChange(receita.id, rendimento.produto_id, e.target.value)
                                    }
                                    onBlur={() => handleRendimentoBlur(receita.id, rendimento.produto_id)}
                                    className="w-full"
                                    placeholder="Ex: 1.5"
                                  />
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
