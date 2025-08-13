
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProdutoIgnorado, DetalheCalculo } from "@/hooks/useNecessidadeInsumos";

interface ProdutosIgnoradosAlertProps {
  produtosIgnorados: ProdutoIgnorado[];
  detalhesCalculo: DetalheCalculo[];
  coberturaRendimentos: number;
}

const motivoLabels = {
  sem_rendimento: "Sem rendimento cadastrado",
  sem_receita: "Sem receita correspondente", 
  receita_sem_insumos: "Receita sem insumos"
};

const motivoColors = {
  sem_rendimento: "bg-yellow-100 text-yellow-800",
  sem_receita: "bg-red-100 text-red-800",
  receita_sem_insumos: "bg-orange-100 text-orange-800"
};

export default function ProdutosIgnoradosAlert({ 
  produtosIgnorados, 
  detalhesCalculo,
  coberturaRendimentos 
}: ProdutosIgnoradosAlertProps) {
  const navigate = useNavigate();

  if (produtosIgnorados.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-green-800">
          ✅ Todos os produtos foram processados com sucesso! 
          Cobertura de rendimentos: <strong>{coberturaRendimentos.toFixed(1)}%</strong>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerta principal */}
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-yellow-800">
          <strong>{produtosIgnorados.length} produtos foram ignorados</strong> no cálculo da lista de compras.
          Cobertura de rendimentos: <strong>{coberturaRendimentos.toFixed(1)}%</strong>
          <br />
          Para obter cálculos mais precisos, configure os rendimentos dos produtos abaixo.
        </AlertDescription>
      </Alert>

      {/* Card com detalhes dos produtos ignorados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            Produtos Ignorados no Cálculo
            <Badge variant="secondary">{produtosIgnorados.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {produtosIgnorados.map((produto, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{produto.nomeProduto}</div>
                <div className="text-sm text-muted-foreground">
                  Quantidade necessária: <strong>{produto.quantidadeNecessaria}</strong> unidades
                </div>
              </div>
              <Badge className={motivoColors[produto.motivo]}>
                {motivoLabels[produto.motivo]}
              </Badge>
            </div>
          ))}
          
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => navigate('/precificacao?tab=rendimentos')}
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Configurar Rendimentos
            </Button>
            <Button
              onClick={() => navigate('/precificacao?tab=receitas')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Gerenciar Receitas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card com detalhes do cálculo realizado */}
      {detalhesCalculo.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Detalhes do Cálculo Realizado
              <Badge variant="secondary">{detalhesCalculo.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {detalhesCalculo.map((detalhe, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{detalhe.produtoNome}</div>
                  <div className="text-xs text-muted-foreground">
                    {detalhe.quantidadeNecessaria} unidades ÷ {detalhe.rendimentoUsado} rendimento = {detalhe.receitasCalculadas} receitas
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={detalhe.tipoRendimento === 'real' ? 'default' : 'secondary'}>
                    {detalhe.tipoRendimento === 'real' ? 'Rendimento Real' : 'Fallback (40)'}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
