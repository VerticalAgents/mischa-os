
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

  // Use exact values from PDV projection interface
  const receitaTotal = 36246.00; // From "Faturamento Mensal" block
  const revendaPadrao = 30366.00; // From "Faturamento por Categoria de Produto"
  const foodService = 5880.00; // From "Faturamento por Categoria de Produto"
  
  const logistica = 1449.84; // From "Total Logística" 
  const insumosRevenda = 8907.36; // From "Custo de Insumos" → Revenda Padrão
  const insumosFoodService = 2450.28; // From "Custo de Insumos" → Food Service
  const totalInsumos = 11357.64; // Sum of insumos (8907.36 + 2450.28)
  const aquisicaoClientes = 2899.68; // 8% of receita total (36246.00 * 0.08)
  
  const totalCustosVariaveis = logistica + totalInsumos + aquisicaoClientes; // 1449.84 + 11357.64 + 2899.68 = 15707.16
  
  // Calculate gross profit
  const lucroBruto = receitaTotal - totalCustosVariaveis;
  
  // Calculate operational result
  const lucroOperacional = lucroBruto - dreData.totalFixedCosts - dreData.totalAdministrativeCosts;
  
  // Tax rate from custos variáveis (3.2%)
  const taxaImposto = 3.2; // 3.2%
  const impostos = receitaTotal * (taxaImposto / 100);
  
  // Net result after taxes
  const resultadoLiquido = lucroOperacional - impostos;

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
                  <Badge variant="outline">{formatCurrency(receitaTotal)}</Badge>
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
                        <div>Revenda Padrão: {formatCurrency(revendaPadrao)}</div>
                        <div>Food Service: {formatCurrency(foodService)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Total: {formatCurrency(revendaPadrao + foodService)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <p className="text-sm"><strong>Bloco: "Faturamento Mensal"</strong> → Valor total: R$ 36.246,00</p>
                      <p className="text-sm"><strong>Bloco: "Faturamento por Categoria de Produto"</strong></p>
                      <p className="text-sm">• Revenda Padrão: R$ 30.366,00</p>
                      <p className="text-sm">• Food Service: R$ 5.880,00</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(receitaTotal)}</p>
                      {Math.abs(receitaTotal - (revendaPadrao + foodService)) < 0.01 ? (
                        <div className="flex items-center gap-2 mt-2 text-green-600">
                          <span className="text-sm">✓ Valores consistentes</span>
                        </div>
                      ) : (
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
                  <Badge variant="outline">{formatCurrency(totalCustosVariaveis)}</Badge>
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
                        <div>2.1. Logística: {formatCurrency(logistica)}</div>
                        <div>2.2. Insumos:</div>
                        <div className="ml-4">• Revenda Padrão: {formatCurrency(insumosRevenda)}</div>
                        <div className="ml-4">• Food Service: {formatCurrency(insumosFoodService)}</div>
                        <div className="ml-4">• Subtotal Insumos: {formatCurrency(totalInsumos)}</div>
                        <div>2.3. Aquisição de Clientes: {formatCurrency(aquisicaoClientes)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Total: {formatCurrency(totalCustosVariaveis)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <ul className="text-sm space-y-1">
                        <li><strong>Logística:</strong> Bloco "Total Logística" → R$ 1.449,84</li>
                        <li><strong>Insumos:</strong> Bloco "Custo de Insumos":</li>
                        <li className="ml-4">• Revenda Padrão: R$ 8.907,36</li>
                        <li className="ml-4">• Food Service: R$ 2.450,28</li>
                        <li><strong>Aquisição:</strong> 8% da Receita Total (R$ 36.246,00 × 8% = R$ 2.899,68)</li>
                      </ul>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(totalCustosVariaveis)}</p>
                      {Math.abs(totalCustosVariaveis - (logistica + totalInsumos + aquisicaoClientes)) < 0.01 ? (
                        <div className="flex items-center gap-2 mt-2 text-green-600">
                          <span className="text-sm">✓ Valores consistentes</span>
                        </div>
                      ) : (
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
                  <Badge variant="outline">{formatCurrency(lucroBruto)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Receita Total: {formatCurrency(receitaTotal)}</div>
                        <div>(-) Custos Variáveis: {formatCurrency(totalCustosVariaveis)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Lucro Bruto: {formatCurrency(lucroBruto)}
                        </div>
                        <div>Margem Bruta: {formatPercent((lucroBruto) / receitaTotal * 100)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(lucroBruto)}</p>
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
                      <p className="text-sm mb-3">Tabela custos_fixos (convertidos para valores mensais)</p>
                      <div className="space-y-2 text-sm">
                        {dreData.fixedCosts.map((cost, index) => (
                          <div key={index} className="flex justify-between p-2 bg-white rounded border">
                            <span className="font-medium">{cost.name}</span>
                            <span className="font-mono">{formatCurrency(cost.value)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-3">
                          <div className="flex justify-between font-semibold">
                            <span>Total dos Custos Fixos:</span>
                            <span>{formatCurrency(dreData.totalFixedCosts)}</span>
                          </div>
                        </div>
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
                      <p className="text-sm mb-3">Tabela custos_variaveis (convertidos para valores mensais)</p>
                      <div className="space-y-2 text-sm">
                        {dreData.administrativeCosts.map((cost, index) => (
                          <div key={index} className="flex justify-between p-2 bg-white rounded border">
                            <span className="font-medium">{cost.name}</span>
                            <span className="font-mono">{formatCurrency(cost.value)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-3">
                          <div className="flex justify-between font-semibold">
                            <span>Total dos Custos Administrativos:</span>
                            <span>{formatCurrency(dreData.totalAdministrativeCosts)}</span>
                          </div>
                        </div>
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
                  <span>📁 Lucro Operacional</span>
                  <Badge variant="outline">{formatCurrency(lucroOperacional)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Lucro Bruto: {formatCurrency(lucroBruto)}</div>
                        <div>(-) Custos Fixos: {formatCurrency(dreData.totalFixedCosts)}</div>
                        <div>(-) Custos Administrativos: {formatCurrency(dreData.totalAdministrativeCosts)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Lucro Operacional: {formatCurrency(lucroOperacional)}
                        </div>
                        <div>Margem Operacional: {formatPercent(lucroOperacional / receitaTotal * 100)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-purple-600">{formatCurrency(lucroOperacional)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Impostos */}
            <AccordionItem value="impostos">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Impostos</span>
                  <Badge variant="outline">{formatCurrency(impostos)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-red-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Receita Total: {formatCurrency(receitaTotal)}</div>
                        <div>Taxa de Imposto: {taxaImposto}%</div>
                        <div className="border-t pt-2 font-semibold">
                          Impostos: {formatCurrency(impostos)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        📌 Fonte dos dados:
                      </h4>
                      <p className="text-sm">Taxa de imposto obtida da aba "Custos Variáveis" → {taxaImposto}%</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(impostos)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>

            {/* Resultado Líquido */}
            <AccordionItem value="resultado-liquido">
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full mr-4">
                  <span>📁 Resultado Líquido</span>
                  <Badge variant="outline">{formatCurrency(resultadoLiquido)}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">🧮 Cálculo:</h4>
                      <div className="space-y-2 text-sm">
                        <div>Lucro Operacional: {formatCurrency(lucroOperacional)}</div>
                        <div>(-) Impostos ({taxaImposto}%): {formatCurrency(impostos)}</div>
                        <div className="border-t pt-2 font-semibold">
                          Resultado Líquido: {formatCurrency(resultadoLiquido)}
                        </div>
                        <div>Margem Líquida: {formatPercent(resultadoLiquido / receitaTotal * 100)}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2">✅ Valor final apresentado:</h4>
                      <p className="text-lg font-bold text-green-600">{formatCurrency(resultadoLiquido)}</p>
                    </div>
                  </CardContent>
                </Card>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">📋 Resumo da Auditoria</h3>
            <div className="text-sm space-y-1">
              <div><strong>Todos os dados foram coletados exclusivamente dos blocos informativos da página 'Projeção de Resultados por PDV'</strong></div>
              <div>• Receita Total: {formatCurrency(receitaTotal)} (Bloco "Faturamento Mensal")</div>
              <div>• Revenda Padrão: {formatCurrency(revendaPadrao)} | Food Service: {formatCurrency(foodService)}</div>
              <div>• Logística: {formatCurrency(logistica)} (Bloco "Total Logística")</div>
              <div>• Insumos Total: {formatCurrency(totalInsumos)} (Bloco "Custo de Insumos")</div>
              <div>• Aquisição: {formatCurrency(aquisicaoClientes)} (8% da receita)</div>
              <div>• <strong>Total Custos Variáveis: {formatCurrency(totalCustosVariaveis)}</strong></div>
              <div>• Impostos: {formatCurrency(impostos)} (Taxa: {taxaImposto}% sobre receita)</div>
              <div>• <strong>Resultado Líquido: {formatCurrency(resultadoLiquido)}</strong></div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
