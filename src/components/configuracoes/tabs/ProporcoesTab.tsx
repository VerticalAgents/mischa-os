
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useConfiguracoesStore } from "@/hooks/useConfiguracoesStore";
import { toast } from "@/hooks/use-toast";

interface ProporcoesConfig {
  [produtoId: string]: number;
}

export default function ProporcoesTab() {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { salvarConfiguracao, obterConfiguracao, loading } = useConfiguracoesStore();
  const [proporcoes, setProporcoes] = useState<ProporcoesConfig>({});
  const [inputValues, setInputValues] = useState<{[key: string]: string}>({});

  // Carregar configurações salvas ao montar o componente
  useEffect(() => {
    const configSalva = obterConfiguracao('proporcoes-padrao');
    console.log('🔄 Configuração carregada:', configSalva);
    if (configSalva && Object.keys(configSalva).length > 0) {
      setProporcoes(configSalva);
      // Inicializar os valores dos inputs com os valores salvos
      const initialInputs: {[key: string]: string} = {};
      Object.entries(configSalva).forEach(([produtoId, valor]) => {
        initialInputs[produtoId] = String(valor);
      });
      setInputValues(initialInputs);
    }
  }, [obterConfiguracao]);

  // Filtrar apenas produtos ativos
  const produtosAtivos = produtos.filter(p => p.ativo);

  // Calcular total dos percentuais
  const totalPercentual = Object.values(proporcoes).reduce((sum, value) => sum + (value || 0), 0);

  const handleInputChange = (produtoId: string, valorString: string) => {
    console.log('📝 Alterando valor para produto', produtoId, ':', valorString);
    
    // Atualizar o valor do input imediatamente (para controle visual)
    setInputValues(prev => ({
      ...prev,
      [produtoId]: valorString
    }));

    // Converter para número e atualizar o estado das proporções
    if (valorString === '') {
      // Se campo vazio, definir como 0
      setProporcoes(prev => ({
        ...prev,
        [produtoId]: 0
      }));
    } else {
      const valorNumerico = parseFloat(valorString);
      if (!isNaN(valorNumerico) && valorNumerico >= 0 && valorNumerico <= 100) {
        setProporcoes(prev => ({
          ...prev,
          [produtoId]: valorNumerico
        }));
      }
    }
  };

  const handleInputBlur = (produtoId: string) => {
    // Quando o usuário sai do campo, garantir que o valor está sincronizado
    const valorAtual = proporcoes[produtoId] || 0;
    setInputValues(prev => ({
      ...prev,
      [produtoId]: String(valorAtual)
    }));
  };

  const salvarConfiguracoes = async () => {
    console.log('💾 Tentando salvar configurações:', proporcoes);
    console.log('📊 Total percentual:', totalPercentual);
    
    if (Math.abs(totalPercentual - 100) > 0.01) { // Tolerância para números decimais
      toast({
        title: "Erro ao salvar",
        description: "A soma dos percentuais precisa ser exatamente 100% para salvar.",
        variant: "destructive"
      });
      return;
    }

    // Filtrar apenas produtos com valor maior que 0
    const proporcoesLimpas = Object.entries(proporcoes)
      .filter(([_, valor]) => valor > 0)
      .reduce((acc, [produtoId, valor]) => {
        acc[produtoId] = valor;
        return acc;
      }, {} as ProporcoesConfig);

    console.log('🧹 Proporções limpas para salvar:', proporcoesLimpas);

    const sucesso = await salvarConfiguracao('proporcoes-padrao', proporcoesLimpas);
    
    if (sucesso) {
      toast({
        title: "Configurações salvas",
        description: "Proporções padrão atualizadas com sucesso!"
      });
    }
  };

  const limparConfiguracoes = () => {
    console.log('🗑️ Limpando todas as configurações');
    setProporcoes({});
    setInputValues({});
    toast({
      title: "Configurações limpas",
      description: "Todas as proporções foram zeradas."
    });
  };

  const zerarProduto = (produtoId: string) => {
    console.log('🔄 Zerando produto:', produtoId);
    setProporcoes(prev => ({
      ...prev,
      [produtoId]: 0
    }));
    setInputValues(prev => ({
      ...prev,
      [produtoId]: '0'
    }));
  };

  if (loadingProdutos) {
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

  const totalValido = Math.abs(totalPercentual - 100) < 0.01;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Proporção Padrão</CardTitle>
          <p className="text-sm text-muted-foreground">
            Defina a composição percentual padrão dos produtos utilizados em pedidos do tipo "Padrão".
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {produtosAtivos.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum produto ativo encontrado. Cadastre produtos em "Estoque &gt; Produtos Acabados" primeiro.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid gap-4">
                {produtosAtivos.map((produto) => (
                  <div key={produto.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`produto-${produto.id}`} className="text-sm font-medium">
                        {produto.nome}
                      </Label>
                      {produto.descricao && (
                        <p className="text-xs text-muted-foreground">{produto.descricao}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <div className="relative">
                          <Input
                            id={`produto-${produto.id}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={inputValues[produto.id] || ''}
                            onChange={(e) => handleInputChange(produto.id, e.target.value)}
                            onBlur={() => handleInputBlur(produto.id)}
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
                        onClick={() => zerarProduto(produto.id)}
                        disabled={!proporcoes[produto.id] || proporcoes[produto.id] === 0}
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
                    onClick={limparConfiguracoes}
                    disabled={loading}
                  >
                    Limpar Tudo
                  </Button>
                  <Button 
                    onClick={salvarConfiguracoes}
                    disabled={loading || !totalValido}
                  >
                    {loading ? "Salvando..." : "Salvar Configurações"}
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
    </div>
  );
}
