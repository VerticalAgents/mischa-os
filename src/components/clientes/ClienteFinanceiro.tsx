import { useState } from "react";
import { Cliente } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, TrendingDown, Package, ChevronDown, ChevronUp } from "lucide-react";
import { useClienteFinanceiro } from "@/hooks/useClienteFinanceiro";
import ScoreFinanceiroCliente from "@/components/clientes/ScoreFinanceiroCliente";
import FaturamentoRealCliente from "@/components/clientes/FaturamentoRealCliente";
interface ClienteFinanceiroProps {
  cliente: Cliente;
}
export default function ClienteFinanceiro({
  cliente
}: ClienteFinanceiroProps) {
  const [isProdutosOpen, setIsProdutosOpen] = useState(false);
  
  const {
    dadosFinanceiros,
    isLoading,
    error
  } = useClienteFinanceiro(cliente);
  /**
   * Os dois blocos de dado real vêm do GestãoClick e não dependem de entrega
   * confirmada nem de categoria habilitada. Ficavam escondidos atrás dos
   * avisos abaixo — justamente nos clientes sobre os quais se quer saber mais.
   */
  const blocosReais = (
    <>
      <ScoreFinanceiroCliente gestaoClickClienteId={cliente.gestaoClickClienteId} />
      <FaturamentoRealCliente gestaoClickClienteId={cliente.gestaoClickClienteId} />
    </>
  );

  const comBlocosReais = (aviso: React.ReactNode) => (
    <div className="space-y-6">
      {blocosReais}
      {aviso}
    </div>
  );

  const avisoSimples = (icone: React.ReactNode, titulo: string, detalhe?: string) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center space-y-2">
            {icone}
            <p className="text-muted-foreground">{titulo}</p>
            {detalhe && <p className="text-sm text-muted-foreground">{detalhe}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return comBlocosReais(
      avisoSimples(
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto" />,
        "Carregando dados de entrega..."
      )
    );
  }

  if (error || !dadosFinanceiros) {
    return comBlocosReais(
      avisoSimples(
        <AlertCircle className="h-8 w-8 text-destructive mx-auto" />,
        "Erro ao carregar os dados de entrega"
      )
    );
  }

  const temCategoriasHabilitadas =
    cliente.categoriasHabilitadas && cliente.categoriasHabilitadas.length > 0;

  if (!temCategoriasHabilitadas) {
    return comBlocosReais(
      avisoSimples(
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />,
        "Nenhuma categoria de produto habilitada para este cliente.",
        'Configure as categorias na aba "Informações" para ver preços e quantidades.'
      )
    );
  }

  const temDados = dadosFinanceiros.quantidadesMedias.length > 0;

  if (!temDados) {
    return comBlocosReais(
      avisoSimples(
        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />,
        "Ainda não há entregas confirmadas para calcular preços e quantidades."
      )
    );
  }

  return <div className="space-y-6">
      {/* Como o cliente paga. Vem antes da margem de propósito: adianta pouco
          saber que o cliente é rentável se o dinheiro não entra na data. */}
      <ScoreFinanceiroCliente gestaoClickClienteId={cliente.gestaoClickClienteId} />

      {/* Preços aplicados: configuração do cliente, não projeção. */}
      <div className="grid grid-cols-1 gap-6">
        {/* Preços Aplicados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Preços Aplicados
            </CardTitle>
            <CardDescription className="text-left">
              Por categoria habilitada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dadosFinanceiros.precosCategoria.map(item => (
                <div 
                  key={item.categoriaId}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{item.categoriaNome}</span>
                    <Badge variant={item.fonte === 'personalizado' ? 'default' : 'secondary'} 
                           className="text-xs">
                      {item.fonte === 'personalizado' ? '⭐' : '📋'}
                    </Badge>
                  </div>
                  <span className="text-base font-bold text-primary">
                    R$ {item.precoUnitario.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quantidades médias, medidas nas entregas confirmadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Quantidades Médias Semanais
          </CardTitle>
          <CardDescription className="text-left">
            Últimas 12 semanas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Total Geral */}
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded-lg border border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">
                Total Médio Semanal
              </p>
              <p className="text-3xl font-bold text-primary">
                {dadosFinanceiros.quantidadesMedias.reduce(
                  (sum, item) => sum + item.quantidadeMediaSemanal, 0
                )} un/sem
              </p>
              <Badge variant="default" className="mt-2">
                {dadosFinanceiros.quantidadesMedias.length} produtos
              </Badge>
            </div>

            {/* Lista de Produtos - Collapsible */}
            <Collapsible open={isProdutosOpen} onOpenChange={setIsProdutosOpen}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Detalhes por Produto
                </p>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2">
                    {isProdutosOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
              
              <CollapsibleContent className="space-y-2">
                {dadosFinanceiros.quantidadesMedias
                  .sort((a, b) => b.quantidadeMediaSemanal - a.quantidadeMediaSemanal)
                  .map(item => (
                    <div 
                      key={item.produtoId}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.produtoNome}</span>
                      </div>
                      <Badge variant="secondary" className="text-base px-3 py-1">
                        {item.quantidadeMediaSemanal} un/sem
                      </Badge>
                    </div>
                  ))}
              </CollapsibleContent>
            </Collapsible>
          </div>
        </CardContent>
      </Card>

      {/* Custos por categoria */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Custos Médios por Categoria
          </CardTitle>
          <CardDescription className="text-left">
            Custo ponderado baseado nas vendas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {dadosFinanceiros.custosCategoria.map(item => (
              <div 
                key={item.categoriaId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <span className="font-medium">{item.categoriaNome}</span>
                <span className="text-base font-bold text-primary">
                  R$ {item.custoMedio.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>;
}