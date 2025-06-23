
import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Database, TrendingUp, AlertCircle } from "lucide-react";
import { DREData } from '@/types/projections';

interface DRECalculationDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dreData: DREData;
}

export function DRECalculationDetails({ open, onOpenChange, dreData }: DRECalculationDetailsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value / 100);
  };

  const breakdown = dreData.detailedBreakdown;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[800px] sm:max-w-[800px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Cálculo Detalhado da DRE Base
          </SheetTitle>
          <SheetDescription>
            Auditoria completa dos cálculos realizados para compor os valores da DRE Base
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          <Accordion type="multiple" className="w-full">
            {/* Receita Operacional */}
            <AccordionItem value="receita">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Receita Operacional</span>
                  <Badge variant="outline">{formatCurrency(dreData.totalRevenue)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Composição da Receita
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Revenda Padrão: {formatCurrency(breakdown?.revendaPadraoFaturamento || 0)}</div>
                        <div>Food Service: {formatCurrency(breakdown?.foodServiceFaturamento || 0)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Total: {formatCurrency((breakdown?.revendaPadraoFaturamento || 0) + (breakdown?.foodServiceFaturamento || 0))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <p className="text-sm">Projeção por PDV → Bloco Faturamento por Categoria de Produto</p>
                      <p className="text-sm">Cálculo baseado no giro semanal dos clientes ativos × preço médio por categoria</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(dreData.totalRevenue)}</p>
                      {Math.abs(dreData.totalRevenue - ((breakdown?.revendaPadraoFaturamento || 0) + (breakdown?.foodServiceFaturamento || 0))) > 0.01 && (
                        <div className="flex items-center gap-2 mt-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Inconsistência detectada nos cálculos!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Custos Variáveis */}
            <AccordionItem value="custos-variaveis">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Custos Variáveis</span>
                  <Badge variant="outline">{formatCurrency(dreData.totalVariableCosts)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Composição dos Custos Variáveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Logística: {formatCurrency(breakdown?.totalLogistica || 0)}</div>
                        <div>Insumos Revenda: {formatCurrency(breakdown?.totalInsumosRevenda || 0)}</div>
                        <div>Insumos Food Service: {formatCurrency(breakdown?.totalInsumosFoodService || 0)}</div>
                        <div>Aquisição de Clientes: {formatCurrency(breakdown?.aquisicaoClientes || 0)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Total: {formatCurrency(
                            (breakdown?.totalLogistica || 0) + 
                            (breakdown?.totalInsumosRevenda || 0) + 
                            (breakdown?.totalInsumosFoodService || 0) + 
                            (breakdown?.aquisicaoClientes || 0)
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li>• Logística: % por tipo de logística × faturamento</li>
                        <li>• Insumos: Custo unitário × volume mensal</li>
                        <li>• Aquisição: 8% do faturamento total</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(dreData.totalVariableCosts)}</p>
                      {Math.abs(dreData.totalVariableCosts - (
                        (breakdown?.totalLogistica || 0) + 
                        (breakdown?.totalInsumosRevenda || 0) + 
                        (breakdown?.totalInsumosFoodService || 0) + 
                        (breakdown?.aquisicaoClientes || 0)
                      )) > 0.01 && (
                        <div className="flex items-center gap-2 mt-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Inconsistência detectada nos cálculos!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Lucro Bruto */}
            <AccordionItem value="lucro-bruto">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Lucro Bruto</span>
                  <Badge variant="outline">{formatCurrency(dreData.grossProfit)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Receita Total: {formatCurrency(dreData.totalRevenue)}</div>
                        <div>(-) Custos Variáveis: {formatCurrency(dreData.totalVariableCosts)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Lucro Bruto: {formatCurrency(dreData.totalRevenue - dreData.totalVariableCosts)}
                        </div>
                        <div>Margem Bruta: {formatPercent(dreData.grossMargin)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(dreData.grossProfit)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Custos Fixos */}
            <AccordionItem value="custos-fixos">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Custos Fixos</span>
                  <Badge variant="outline">{formatCurrency(dreData.totalFixedCosts)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <p className="text-sm">Tabela custos_fixos (convertidos para valores mensais)</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {dreData.fixedCosts.map((cost, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{cost.name}</span>
                            <span>{formatCurrency(cost.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(dreData.totalFixedCosts)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Custos Administrativos */}
            <AccordionItem value="custos-admin">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Custos Administrativos</span>
                  <Badge variant="outline">{formatCurrency(dreData.totalAdministrativeCosts)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <p className="text-sm">Tabela custos_variaveis (convertidos para valores mensais)</p>
                      <div className="mt-2 space-y-1 text-sm">
                        {dreData.administrativeCosts.map((cost, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{cost.name}</span>
                            <span>{formatCurrency(cost.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(dreData.totalAdministrativeCosts)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Resultado Operacional */}
            <AccordionItem value="resultado-operacional">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Resultado Operacional</span>
                  <Badge variant="outline">{formatCurrency(dreData.operationalResult)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Lucro Bruto: {formatCurrency(dreData.grossProfit)}</div>
                        <div>(-) Custos Fixos: {formatCurrency(dreData.totalFixedCosts)}</div>
                        <div>(-) Custos Administrativos: {formatCurrency(dreData.totalAdministrativeCosts)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Resultado Operacional: {formatCurrency(dreData.grossProfit - dreData.totalFixedCosts - dreData.totalAdministrativeCosts)}
                        </div>
                        <div>Margem Operacional: {formatPercent(dreData.operationalMargin)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(dreData.operationalResult)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 Resumo da Auditoria</h3>
            <div className="text-sm space-y-1">
              <div>• Receita calculada: {formatCurrency((breakdown?.revendaPadraoFaturamento || 0) + (breakdown?.foodServiceFaturamento || 0))}</div>
              <div>• Receita exibida: {formatCurrency(dreData.totalRevenue)}</div>
              <div>• Custos Variáveis calculados: {formatCurrency(
                (breakdown?.totalLogistica || 0) + 
                (breakdown?.totalInsumosRevenda || 0) + 
                (breakdown?.totalInsumosFoodService || 0) + 
                (breakdown?.aquisicaoClientes || 0)
              )}</div>
              <div>• Custos Variáveis exibidos: {formatCurrency(dreData.totalVariableCosts)}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
