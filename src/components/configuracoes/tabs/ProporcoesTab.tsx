
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

  // Carregar configurações salvas ao montar o componente
  useEffect(() => {
    const configSalva = obterConfiguracao('proporcoes-padrao');
    if (configSalva && Object.keys(configSalva).length > 0) {
      setProporcoes(configSalva);
    }
  }, [obterConfiguracao]);

  // Filtrar apenas produtos ativos
  const produtosAtivos = produtos.filter(p => p.ativo);

  // Calcular total dos percentuais
  const totalPercentual = Object.values(proporcoes).reduce((sum, value) => sum + (value || 0), 0);

  const handleProporçãoChange = (produtoId: string, valor: string) => {
    // Permitir valores vazios durante a edição
    if (valor === '') {
      setProporcoes(prev => ({
        ...prev,
        [produtoId]: 0
      }));
      return;
    }

    const valorNumerico = parseInt(valor) || 0;
    
    // Permitir qualquer valor durante a edição, sem validação de limite
    // A validação será feita apenas no salvamento
    setProporcoes(prev => ({
      ...prev,
      [produtoId]: valorNumerico
    }));
  };

  const handleRemoverProduto = (produtoId: string) => {
    setProporcoes(prev => {
      const novasProporcoes = { ...prev };
      delete novasProporcoes[produtoId];
      return novasProporcoes;
    });
    
    toast({
      title: "Produto removido",
      description: "Produto removido das proporções."
    });
  };

  const salvarConfiguracoes = async () => {
    if (totalPercentual !== 100) {
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

    const sucesso = await salvarConfiguracao('proporcoes-padrao', proporcoesLimpas);
    
    if (sucesso) {
      toast({
        title: "Configurações salvas",
        description: "Proporções padrão atualizadas com sucesso!"
      });
    }
  };

  const limparConfiguracoes = () => {
    setProporcoes({});
    toast({
      title: "Configurações limpas",
      description: "Todas as proporções foram zeradas."
    });
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
                    <div className="w-24">
                      <div className="relative">
                        <Input
                          id={`produto-${produto.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={proporcoes[produto.id] || ''}
                          onChange={(e) => handleProporçãoChange(produto.id, e.target.value)}
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
                      onClick={() => handleRemoverProduto(produto.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remover
                    </Button>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">Total atual: </span>
                  <span className={`font-bold ${
                    totalPercentual === 100 ? 'text-green-600' : 
                    totalPercentual > 100 ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {totalPercentual}%
                  </span>
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
                    disabled={loading || totalPercentual !== 100}
                  >
                    {loading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </div>
              </div>

              {totalPercentual !== 100 && totalPercentual > 0 && (
                <Alert variant={totalPercentual > 100 ? "destructive" : "default"}>
                  <AlertDescription>
                    {totalPercentual > 100 
                      ? `O total está ${totalPercentual - 100}% acima de 100%.`
                      : `Faltam ${100 - totalPercentual}% para completar 100%.`
                    }
                    {totalPercentual < 100 && " Você pode continuar editando e salvar quando atingir exatamente 100%."}
                  </AlertDescription>
                </Alert>
              )}

              {totalPercentual === 100 && (
                <Alert>
                  <AlertDescription>
                    ✅ Proporções configuradas corretamente. Clique em "Salvar Configurações" para confirmar.
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
