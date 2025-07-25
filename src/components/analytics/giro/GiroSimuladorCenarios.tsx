
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Play, RotateCcw, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface GiroSimuladorCenariosProps {
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isLoading: boolean;
}

interface CenarioSimulacao {
  nome: string;
  aumentoGiro: number;
  aumentoPreco: number;
  reducaoPeriodicidade: number;
  impactoFaturamento: number;
  impactoOperacional: number;
  viabilidade: 'alta' | 'media' | 'baixa';
}

export function GiroSimuladorCenarios({ dadosConsolidados, isLoading }: GiroSimuladorCenariosProps) {
  const [cenarioAtual, setCenarioAtual] = useState<CenarioSimulacao>({
    nome: 'Cenário Base',
    aumentoGiro: 0,
    aumentoPreco: 0,
    reducaoPeriodicidade: 0,
    impactoFaturamento: 0,
    impactoOperacional: 0,
    viabilidade: 'alta'
  });

  const [cenariosSalvos, setCenariosSalvos] = useState<CenarioSimulacao[]>([
    {
      nome: 'Crescimento Conservador',
      aumentoGiro: 10,
      aumentoPreco: 5,
      reducaoPeriodicidade: 0,
      impactoFaturamento: 15.5,
      impactoOperacional: 8,
      viabilidade: 'alta'
    },
    {
      nome: 'Crescimento Agressivo',
      aumentoGiro: 25,
      aumentoPreco: 15,
      reducaoPeriodicidade: 10,
      impactoFaturamento: 43.75,
      impactoOperacional: 25,
      viabilidade: 'media'
    },
    {
      nome: 'Otimização Operacional',
      aumentoGiro: 5,
      aumentoPreco: 0,
      reducaoPeriodicidade: 20,
      impactoFaturamento: 5,
      impactoOperacional: -15,
      viabilidade: 'alta'
    }
  ]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const calcularImpactos = (cenario: CenarioSimulacao) => {
    const faturamentoBase = dadosConsolidados.reduce((sum, item) => sum + item.faturamento_semanal_previsto, 0);
    const giroBase = dadosConsolidados.reduce((sum, item) => sum + item.giro_semanal_calculado, 0);
    
    const novoGiro = giroBase * (1 + cenario.aumentoGiro / 100);
    const novoFaturamento = faturamentoBase * (1 + cenario.aumentoGiro / 100) * (1 + cenario.aumentoPreco / 100);
    
    const impactoFaturamento = ((novoFaturamento - faturamentoBase) / faturamentoBase) * 100;
    const impactoOperacional = cenario.aumentoGiro - cenario.reducaoPeriodicidade;
    
    let viabilidade: 'alta' | 'media' | 'baixa' = 'alta';
    if (impactoOperacional > 20) viabilidade = 'baixa';
    else if (impactoOperacional > 10) viabilidade = 'media';
    
    return {
      ...cenario,
      impactoFaturamento,
      impactoOperacional,
      viabilidade
    };
  };

  const aplicarCenario = () => {
    const cenarioCalculado = calcularImpactos(cenarioAtual);
    setCenarioAtual(cenarioCalculado);
  };

  const resetarCenario = () => {
    setCenarioAtual({
      nome: 'Cenário Base',
      aumentoGiro: 0,
      aumentoPreco: 0,
      reducaoPeriodicidade: 0,
      impactoFaturamento: 0,
      impactoOperacional: 0,
      viabilidade: 'alta'
    });
  };

  const salvarCenario = () => {
    const novoCenario = { ...cenarioAtual, nome: `Cenário ${cenariosSalvos.length + 1}` };
    setCenariosSalvos([...cenariosSalvos, novoCenario]);
  };

  // Dados para gráfico de comparação
  const dadosComparacao = [
    { nome: 'Atual', faturamento: 100, giro: 100 },
    { 
      nome: 'Simulado', 
      faturamento: 100 + cenarioAtual.impactoFaturamento, 
      giro: 100 + cenarioAtual.aumentoGiro 
    }
  ];

  const getViabilidadeBadge = (viabilidade: string) => {
    const variants = {
      alta: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      baixa: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge variant="secondary" className={variants[viabilidade as keyof typeof variants]}>
        {viabilidade}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Simulador de Cenários de Giro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="simulador" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="simulador">Simulador</TabsTrigger>
              <TabsTrigger value="cenarios">Cenários Salvos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="simulador" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Parâmetros da Simulação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome do Cenário</Label>
                        <Input
                          value={cenarioAtual.nome}
                          onChange={(e) => setCenarioAtual({...cenarioAtual, nome: e.target.value})}
                          placeholder="Ex: Crescimento Q1 2024"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Aumento do Giro (%): {cenarioAtual.aumentoGiro}%</Label>
                        <Slider
                          value={[cenarioAtual.aumentoGiro]}
                          onValueChange={(value) => setCenarioAtual({...cenarioAtual, aumentoGiro: value[0]})}
                          max={50}
                          min={-20}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Aumento de Preço (%): {cenarioAtual.aumentoPreco}%</Label>
                        <Slider
                          value={[cenarioAtual.aumentoPreco]}
                          onValueChange={(value) => setCenarioAtual({...cenarioAtual, aumentoPreco: value[0]})}
                          max={30}
                          min={-10}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Redução Periodicidade (%): {cenarioAtual.reducaoPeriodicidade}%</Label>
                        <Slider
                          value={[cenarioAtual.reducaoPeriodicidade]}
                          onValueChange={(value) => setCenarioAtual({...cenarioAtual, reducaoPeriodicidade: value[0]})}
                          max={30}
                          min={0}
                          step={1}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={aplicarCenario} className="flex-1">
                          <Play className="h-4 w-4 mr-2" />
                          Simular
                        </Button>
                        <Button variant="outline" onClick={resetarCenario}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Resetar
                        </Button>
                        <Button variant="outline" onClick={salvarCenario}>
                          Salvar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resultados da Simulação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {cenarioAtual.impactoFaturamento > 0 ? '+' : ''}{cenarioAtual.impactoFaturamento.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Impacto Faturamento</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {cenarioAtual.impactoOperacional > 0 ? '+' : ''}{cenarioAtual.impactoOperacional.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Impacto Operacional</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Viabilidade:</span>
                        {getViabilidadeBadge(cenarioAtual.viabilidade)}
                      </div>
                      
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dadosComparacao}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nome" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="faturamento" stroke="#3b82f6" name="Faturamento" />
                            <Line type="monotone" dataKey="giro" stroke="#10b981" name="Giro" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="cenarios" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cenariosSalvos.map((cenario, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        {cenario.nome}
                        {getViabilidadeBadge(cenario.viabilidade)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Giro: +{cenario.aumentoGiro}%</div>
                        <div>Preço: +{cenario.aumentoPreco}%</div>
                        <div>Periodicidade: -{cenario.reducaoPeriodicidade}%</div>
                        <div>Faturamento: +{cenario.impactoFaturamento.toFixed(1)}%</div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setCenarioAtual(cenario)}
                      >
                        Aplicar Cenário
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
