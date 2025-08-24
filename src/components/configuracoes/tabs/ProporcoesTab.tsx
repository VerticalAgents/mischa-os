import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import OrdemProdutosManager from "./components/OrdemProdutosManager";

export default function ProporcoesTab() {
  const { proporcoes, loading, salvarTodasProporcoesComOrdem, carregarProporcoes } = useSupabaseProporoesPadrao();
  const [percentuais, setPercentuais] = useState<{[produtoId: string]: string}>({});
  const [salvando, setSalvando] = useState(false);
  const [proporcoesOrdenadas, setProporcoesOrdenadas] = useState(proporcoes);

  // Sincronizar percentuais quando as proporções são carregadas
  useEffect(() => {
    const novosPercentuais: {[produtoId: string]: string} = {};
    proporcoes.forEach(proporcao => {
      novosPercentuais[proporcao.produto_id] = String(proporcao.percentual);
    });
    setPercentuais(novosPercentuais);
    setProporcoesOrdenadas([...proporcoes]);
  }, [proporcoes]);

  // Calcular total dos percentuais
  const totalPercentual = Object.values(percentuais).reduce((sum, valor) => {
    const num = parseFloat(valor) || 0;
    return sum + num;
  }, 0);

  const handlePercentualChange = (produtoId: string, valor: string) => {
    // Permitir campo vazio ou números válidos
    if (valor === '' || /^\d*\.?\d*$/.test(valor)) {
      const num = parseFloat(valor);
      // Validar se está no range válido (0-100)
      if (valor === '' || (num >= 0 && num <= 100)) {
        setPercentuais(prev => ({
          ...prev,
          [produtoId]: valor
        }));
      }
    }
  };

  const zerarProduto = (produtoId: string) => {
    setPercentuais(prev => ({
      ...prev,
      [produtoId]: '0'
    }));
  };

  const limparTodos = () => {
    const novosPercentuais: {[produtoId: string]: string} = {};
    proporcoes.forEach(proporcao => {
      novosPercentuais[proporcao.produto_id] = '0';
    });
    setPercentuais(novosPercentuais);
  };

  const salvarConfiguracoes = async () => {
    setSalvando(true);
    try {
      const novasProporcoes = proporcoesOrdenadas.map((proporcao, index) => ({
        produto_id: proporcao.produto_id,
        percentual: parseFloat(percentuais[proporcao.produto_id] || '0'),
        ordem: index + 1
      }));

      const sucesso = await salvarTodasProporcoesComOrdem(novasProporcoes);
      if (sucesso) {
        console.log('✅ Proporções e ordem salvas com sucesso');
        await carregarProporcoes();
      }
    } finally {
      setSalvando(false);
    }
  };

  const handleOrdemChange = (novasProporcoes: any[]) => {
    setProporcoesOrdenadas(novasProporcoes);
  };

  const totalValido = Math.abs(totalPercentual - 100) < 0.01;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Carregando produtos...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="proporcoes" className="w-full">
        <TabsList>
          <TabsTrigger value="proporcoes">Proporções</TabsTrigger>
          <TabsTrigger value="ordem">Ordem dos Produtos</TabsTrigger>
        </TabsList>

        <TabsContent value="proporcoes">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Proporção Padrão</CardTitle>
              <p className="text-sm text-muted-foreground">
                Defina a composição percentual padrão dos produtos utilizados em pedidos do tipo "Padrão".
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {proporcoes.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Nenhum produto ativo encontrado. Cadastre produtos em "Estoque &gt; Produtos Acabados" primeiro.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid gap-4">
                    {proporcoes.map((proporcao) => (
                      <div key={proporcao.produto_id} className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`produto-${proporcao.produto_id}`} className="text-sm font-medium">
                            {proporcao.produto_nome}
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-24">
                            <div className="relative">
                              <Input
                                id={`produto-${proporcao.produto_id}`}
                                type="text"
                                value={percentuais[proporcao.produto_id] || ''}
                                onChange={(e) => handlePercentualChange(proporcao.produto_id, e.target.value)}
                                placeholder="0"
                                className="text-center pr-8"
                              />
                              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                                %
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => zerarProduto(proporcao.produto_id)}
                            disabled={percentuais[proporcao.produto_id] === '0'}
                          >
                            Zerar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">Total atual: </span>
                      <span className={`font-bold ${
                        totalValido ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {totalPercentual.toFixed(1)}%
                      </span>
                      {totalValido && (
                        <span className="ml-2 text-green-600">✅</span>
                      )}
                      {!totalValido && (
                        <span className="ml-2 text-red-600">⚠️</span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={limparTodos}
                        disabled={salvando}
                      >
                        Limpar Tudo
                      </Button>
                      <Button 
                        onClick={salvarConfiguracoes}
                        disabled={salvando || !totalValido}
                      >
                        {salvando ? "Salvando..." : "Salvar Configurações"}
                      </Button>
                    </div>
                  </div>

                  {!totalValido && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {totalPercentual > 100 
                          ? `O total está ${(totalPercentual - 100).toFixed(1)}% acima de 100%. Reduza os percentuais para salvar.`
                          : `Faltam ${(100 - totalPercentual).toFixed(1)}% para completar 100%. Continue editando até atingir exatamente 100%.`
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {totalValido && (
                    <Alert>
                      <AlertDescription>
                        ✅ Proporções configuradas corretamente! Clique em "Salvar Configurações" para confirmar.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ordem">
          <OrdemProdutosManager 
            proporcoes={proporcoesOrdenadas}
            onOrdemChange={handleOrdemChange}
          />
          
          <div className="mt-4 flex justify-end">
            <Button 
              onClick={salvarConfiguracoes}
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar Ordem"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
