
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Bug, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { supabase } from "@/integrations/supabase/client";

interface AuditoriaEntregasDebugProps {
  dataInicio: string;
  dataFim: string;
}

export default function AuditoriaEntregasDebug({ dataInicio, dataFim }: AuditoriaEntregasDebugProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [produtosFinais, setProdutosFinais] = useState<any[]>([]);
  const [loadingProdutosFinais, setLoadingProdutosFinais] = useState(false);
  
  const { registros, carregarHistorico } = useHistoricoEntregasStore();
  const { clientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const { produtos } = useSupabaseProdutos();

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const carregarProdutosFinais = async () => {
    setLoadingProdutosFinais(true);
    try {
      const { data, error } = await supabase
        .from('produtos_finais')
        .select('*')
        .eq('ativo', true);
      
      if (error) {
        console.error('Erro ao carregar produtos finais:', error);
      } else {
        setProdutosFinais(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos finais:', error);
    } finally {
      setLoadingProdutosFinais(false);
    }
  };

  useEffect(() => {
    carregarProdutosFinais();
  }, []);

  const registrosFiltrados = registros.filter(registro => {
    const dataRegistro = new Date(registro.data);
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    return dataRegistro >= inicio && dataRegistro <= fim;
  });

  const entregas = registrosFiltrados.filter(r => r.tipo === 'entrega');

  const getSampleEntrega = () => {
    return entregas[0] || null;
  };

  const sampleEntrega = getSampleEntrega();

  const getClienteInfo = (clienteId: string) => {
    return clientes.find(c => c.id === clienteId);
  };

  const getProdutoInfo = (produtoId: string) => {
    // Verificar em produtos
    const produtoLegacy = produtos.find(p => p.id === produtoId);
    if (produtoLegacy) return { source: 'produtos', produto: produtoLegacy };
    
    // Verificar em produtos_finais
    const produtoFinal = produtosFinais.find(p => p.id === produtoId);
    if (produtoFinal) return { source: 'produtos_finais', produto: produtoFinal };
    
    return null;
  };

  const getCategoriaInfo = (categoriaId: number) => {
    return categorias.find(c => c.id === categoriaId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bug className="h-5 w-5" />
          Debug - Auditoria de Entregas
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            carregarHistorico();
            carregarProdutosFinais();
          }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Recarregar Dados
        </Button>
      </div>

      {/* Resumo dos Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo dos Dados Carregados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Registros Totais</span>
              <div className="text-2xl font-bold">{registros.length}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Entregas (Período)</span>
              <div className="text-2xl font-bold">{entregas.length}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Clientes</span>
              <div className="text-2xl font-bold">{clientes.length}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Categorias</span>
              <div className="text-2xl font-bold">{categorias.length}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Produtos (Legacy)</span>
              <div className="text-2xl font-bold">{produtos.length}</div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Produtos Finais</span>
              <div className="text-2xl font-bold">
                {loadingProdutosFinais ? '...' : produtosFinais.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados das Fontes */}
      <div className="space-y-4">
        <Collapsible 
          open={expandedSections.includes('categorias')}
          onOpenChange={() => toggleSection('categorias')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Categorias de Produto ({categorias.length})
              </span>
              {expandedSections.includes('categorias') ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  {categorias.map(categoria => (
                    <div key={categoria.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span>ID: {categoria.id} - {categoria.nome}</span>
                      <Badge variant="secondary">{categoria.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                  ))}
                  {categorias.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Nenhuma categoria encontrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible 
          open={expandedSections.includes('produtos')}
          onOpenChange={() => toggleSection('produtos')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Produtos Legacy ({produtos.length})
              </span>
              {expandedSections.includes('produtos') ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {produtos.map(produto => (
                    <div key={produto.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span>ID: {produto.id} - {produto.nome}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">Cat: {produto.categoria_id}</Badge>
                        <Badge variant="secondary">{produto.ativo ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                    </div>
                  ))}
                  {produtos.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Nenhum produto legacy encontrado
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        <Collapsible 
          open={expandedSections.includes('produtosFinais')}
          onOpenChange={() => toggleSection('produtosFinais')}
        >
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Produtos Finais ({produtosFinais.length})
              </span>
              {expandedSections.includes('produtosFinais') ? 
                <ChevronDown className="h-4 w-4" /> : 
                <ChevronRight className="h-4 w-4" />
              }
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {produtosFinais.map(produto => (
                    <div key={produto.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span>ID: {produto.id} - {produto.nome}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline">Cat: {produto.categoria_id}</Badge>
                        <Badge variant="secondary">{produto.ativo ? 'Ativo' : 'Inativo'}</Badge>
                      </div>
                    </div>
                  ))}
                  {produtosFinais.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      {loadingProdutosFinais ? 'Carregando...' : 'Nenhum produto final encontrado'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Exemplo de Entrega */}
        {sampleEntrega && (
          <Collapsible 
            open={expandedSections.includes('sampleEntrega')}
            onOpenChange={() => toggleSection('sampleEntrega')}
          >
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Exemplo de Entrega (Análise)
                </span>
                {expandedSections.includes('sampleEntrega') ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Dados da Entrega</h4>
                      <div className="bg-muted p-3 rounded text-sm">
                        <pre>{JSON.stringify(sampleEntrega, null, 2)}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Cliente</h4>
                      <div className="bg-muted p-3 rounded text-sm">
                        {getClienteInfo(sampleEntrega.cliente_id) ? (
                          <pre>{JSON.stringify(getClienteInfo(sampleEntrega.cliente_id), null, 2)}</pre>
                        ) : (
                          <span className="text-red-500">Cliente não encontrado: {sampleEntrega.cliente_id}</span>
                        )}
                      </div>
                    </div>

                    {sampleEntrega.itens && sampleEntrega.itens.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Análise dos Itens</h4>
                        <div className="space-y-2">
                          {sampleEntrega.itens.map((item: any, index: number) => (
                            <div key={index} className="bg-muted p-3 rounded text-sm">
                              <div className="mb-2">
                                <strong>Item {index + 1}:</strong>
                              </div>
                              <div className="mb-2">
                                <strong>Produto ID:</strong> {item.produto_id || 'N/A'}
                              </div>
                              <div className="mb-2">
                                <strong>Categoria ID:</strong> {item.categoria_id || 'N/A'}
                              </div>
                              <div className="mb-2">
                                <strong>Quantidade:</strong> {item.quantidade || 'N/A'}
                              </div>
                              
                              {item.produto_id && (
                                <div className="mb-2">
                                  <strong>Produto Encontrado:</strong>{' '}
                                  {getProdutoInfo(item.produto_id) ? (
                                    <span className="text-green-600">
                                      Sim ({getProdutoInfo(item.produto_id)?.source})
                                    </span>
                                  ) : (
                                    <span className="text-red-500">Não encontrado</span>
                                  )}
                                </div>
                              )}
                              
                              {item.categoria_id && (
                                <div className="mb-2">
                                  <strong>Categoria Encontrada:</strong>{' '}
                                  {getCategoriaInfo(item.categoria_id) ? (
                                    <span className="text-green-600">
                                      Sim - {getCategoriaInfo(item.categoria_id)?.nome}
                                    </span>
                                  ) : (
                                    <span className="text-red-500">Não encontrada</span>
                                  )}
                                </div>
                              )}
                              
                              <div className="bg-gray-100 p-2 rounded mt-2">
                                <strong>Dados Brutos:</strong>
                                <pre className="text-xs">{JSON.stringify(item, null, 2)}</pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
