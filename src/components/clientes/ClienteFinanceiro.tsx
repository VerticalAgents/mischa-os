import { Cliente } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useClienteFinanceiro } from "@/hooks/useClienteFinanceiro";

interface ClienteFinanceiroProps {
  cliente: Cliente;
}

export default function ClienteFinanceiro({ cliente }: ClienteFinanceiroProps) {
  const { dadosFinanceiros, isLoading, error } = useClienteFinanceiro(cliente);
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Carregando dados financeiros...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-destructive">Erro ao carregar dados financeiros</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!dadosFinanceiros) {
    return null;
  }
  
  // Verificar se há categorias habilitadas
  const temCategoriasHabilitadas = cliente.categoriasHabilitadas && cliente.categoriasHabilitadas.length > 0;
  
  if (!temCategoriasHabilitadas) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">Nenhuma categoria de produto habilitada para este cliente.</p>
              <p className="text-sm text-muted-foreground">
                Configure as categorias na aba "Informações" para visualizar os dados financeiros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const temDados = dadosFinanceiros.quantidadesMedias.length > 0;
  
  if (!temDados) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto" />
              <p className="text-muted-foreground">Ainda não há entregas suficientes para calcular médias financeiras.</p>
              <p className="text-sm text-muted-foreground">
                Os dados serão exibidos após as primeiras entregas serem confirmadas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm">
          📊 <strong>Análise baseada nas últimas 12 semanas</strong> de histórico de entregas
        </p>
      </div>
      
      {/* 1. Resumo Financeiro Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Resumo Financeiro Mensal</CardTitle>
          <CardDescription>
            Projeção baseada na média das últimas 12 semanas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Faturamento Médio */}
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="text-sm text-green-700 dark:text-green-400 mb-1">Faturamento Médio Mensal</div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-300">
                R$ {dadosFinanceiros.resumoMensal.faturamentoMedio.toFixed(2)}
              </div>
            </div>
            
            {/* Quantidade de Entregas/Mês */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="text-sm text-blue-700 dark:text-blue-400 mb-1">Entregas por Mês</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                {dadosFinanceiros.resumoMensal.quantidadeEntregasMes} entregas
              </div>
            </div>
            
            {/* Custo dos Produtos */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="text-sm text-amber-700 dark:text-amber-400 mb-1">Custo dos Produtos</div>
              <div className="text-2xl font-bold text-amber-800 dark:text-amber-300">
                R$ {dadosFinanceiros.resumoMensal.custoProdutos.toFixed(2)}
              </div>
            </div>
            
            {/* Custo Logístico */}
            {cliente.tipoLogistica === 'Própria' && (
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <div className="text-sm text-orange-700 dark:text-orange-400 mb-1">
                  Custo Logístico (R$15/entrega)
                </div>
                <div className="text-2xl font-bold text-orange-800 dark:text-orange-300">
                  R$ {dadosFinanceiros.resumoMensal.custoLogistico.toFixed(2)}
                </div>
                <div className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                  {dadosFinanceiros.resumoMensal.quantidadeEntregasMes} entregas × R$15,00
                </div>
              </div>
            )}
            
            {/* Imposto Estimado */}
            {cliente.emiteNotaFiscal && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="text-sm text-purple-700 dark:text-purple-400 mb-1">
                  Imposto Estimado (Simples 4%)
                </div>
                <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">
                  R$ {dadosFinanceiros.resumoMensal.impostoEstimado.toFixed(2)}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                  4% sobre faturamento
                </div>
              </div>
            )}
            
            {/* Taxa de Boleto */}
            {cliente.formaPagamento === 'Boleto' && (
              <div className="p-4 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                <div className="text-sm text-pink-700 dark:text-pink-400 mb-1">
                  Taxa de Boleto (R$2,19/entrega)
                </div>
                <div className="text-2xl font-bold text-pink-800 dark:text-pink-300">
                  R$ {dadosFinanceiros.resumoMensal.taxaBoleto.toFixed(2)}
                </div>
                <div className="text-xs text-pink-600 dark:text-pink-500 mt-1">
                  {dadosFinanceiros.resumoMensal.quantidadeEntregasMes} entregas × R$2,19
                </div>
              </div>
            )}
          </div>
          
          {/* Total de Custos Operacionais */}
          <div className="mt-4 p-4 bg-muted border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Total de Custos Operacionais:</span>
              <span className="text-xl font-bold">
                R$ {dadosFinanceiros.resumoMensal.totalCustosOperacionais.toFixed(2)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Margem Bruta:</span>
                {dadosFinanceiros.resumoMensal.margemBruta >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <div className="text-right">
                <div className={`text-xl font-bold ${
                  dadosFinanceiros.resumoMensal.margemBruta >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  R$ {dadosFinanceiros.resumoMensal.margemBruta.toFixed(2)}
                </div>
                <div className={`text-sm ${
                  dadosFinanceiros.resumoMensal.margemBruta >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {dadosFinanceiros.resumoMensal.margemBrutaPercentual.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* 2. Preços Aplicados por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Preços Aplicados</CardTitle>
          <CardDescription>
            Preços unitários por categoria de produto habilitada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dadosFinanceiros.precosCategoria.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum preço configurado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço Unitário</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFinanceiros.precosCategoria.map(item => (
                  <TableRow key={item.categoriaId}>
                    <TableCell className="font-medium">{item.categoriaNome}</TableCell>
                    <TableCell>R$ {item.precoUnitario.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={item.fonte === 'personalizado' ? 'default' : 'secondary'}>
                        {item.fonte === 'personalizado' ? '⭐ Personalizado' : '📋 Padrão'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* 3. Quantidades Médias por Produto */}
      <Card>
        <CardHeader>
          <CardTitle>📦 Quantidades Médias Semanais</CardTitle>
          <CardDescription>
            Média de unidades vendidas por semana (últimas 12 semanas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Total (12 sem)</TableHead>
                <TableHead className="text-right">Média Semanal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dadosFinanceiros.quantidadesMedias.map(item => (
                <TableRow key={item.produtoId}>
                  <TableCell className="font-medium">{item.produtoNome}</TableCell>
                  <TableCell className="text-right">{item.quantidadeTotal12Semanas} un</TableCell>
                  <TableCell className="text-right font-medium">
                    {item.quantidadeMediaSemanal} un/sem
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* 4. Custos Médios por Categoria */}
      <Card>
        <CardHeader>
          <CardTitle>💵 Custos Médios por Categoria</CardTitle>
          <CardDescription>
            Custo unitário médio dos produtos em cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          {dadosFinanceiros.custosCategoria.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nenhum custo disponível
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Custo Médio Unitário</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dadosFinanceiros.custosCategoria.map(item => (
                  <TableRow key={item.categoriaId}>
                    <TableCell className="font-medium">{item.categoriaNome}</TableCell>
                    <TableCell className="text-right">R$ {item.custoMedio.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
