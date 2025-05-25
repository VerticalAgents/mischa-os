
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { toast } from "@/hooks/use-toast";

interface ProporcoesConfig {
  [produtoId: number]: number;
}

export default function ProporcoesTab() {
  const { produtos } = useProdutoStore();
  const [proporcoes, setProporcoes] = useState<ProporcoesConfig>({});
  const [loading, setLoading] = useState(false);

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const savedProporcoes = localStorage.getItem('proporcoes-padrao');
    if (savedProporcoes) {
      setProporcoes(JSON.parse(savedProporcoes));
    }
  }, []);

  // Filtrar apenas produtos ativos
  const produtosAtivos = produtos.filter(p => p.ativo);

  // Calcular total dos percentuais
  const totalPercentual = Object.values(proporcoes).reduce((sum, value) => sum + (value || 0), 0);

  const handleProporçãoChange = (produtoId: number, valor: string) => {
    const valorNumerico = parseFloat(valor) || 0;
    setProporcoes(prev => ({
      ...prev,
      [produtoId]: valorNumerico
    }));
  };

  const salvarConfiguracoes = () => {
    if (totalPercentual !== 100) {
      toast({
        title: "Erro ao salvar",
        description: "A soma dos percentuais precisa ser exatamente 100% para salvar.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    // Salvar no localStorage (em um sistema real, seria salvo no backend)
    localStorage.setItem('proporcoes-padrao', JSON.stringify(proporcoes));
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações salvas",
        description: "Proporções padrão atualizadas com sucesso!"
      });
    }, 500);
  };

  const limparConfiguracoes = () => {
    setProporcoes({});
    localStorage.removeItem('proporcoes-padrao');
    toast({
      title: "Configurações limpas",
      description: "Todas as proporções foram zeradas."
    });
  };

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
                Nenhum produto ativo encontrado. Cadastre produtos em "Precificação > Produtos" primeiro.
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
                    </div>
                    <div className="w-24">
                      <div className="relative">
                        <Input
                          id={`produto-${produto.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
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
                    {totalPercentual.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={limparConfiguracoes}
                    disabled={loading}
                  >
                    Limpar
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
                      ? `O total está ${(totalPercentual - 100).toFixed(1)}% acima de 100%.`
                      : `Faltam ${(100 - totalPercentual).toFixed(1)}% para completar 100%.`
                    }
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
