
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from 'lucide-react';
import { CostItem, DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';

interface CostsManagementSectionProps {
  scenario: DREData;
}

export function CostsManagementSection({ scenario }: CostsManagementSectionProps) {
  const { updateScenario } = useProjectionStore();

  const addCost = (type: 'fixedCosts' | 'administrativeCosts') => {
    const newCost: CostItem = {
      name: 'Novo Custo',
      value: 0
    };
    
    const updatedCosts = [...scenario[type], newCost];
    updateScenario(scenario.id, { [type]: updatedCosts });
  };

  const removeCost = (type: 'fixedCosts' | 'administrativeCosts', index: number) => {
    const updatedCosts = scenario[type].filter((_, i) => i !== index);
    updateScenario(scenario.id, { [type]: updatedCosts });
  };

  const updateCost = (type: 'fixedCosts' | 'administrativeCosts', index: number, field: 'name' | 'value', value: string | number) => {
    const updatedCosts = [...scenario[type]];
    updatedCosts[index] = { ...updatedCosts[index], [field]: value };
    
    // Recalcular totais
    const totalFixedCosts = type === 'fixedCosts' 
      ? updatedCosts.reduce((sum, cost) => sum + cost.value, 0)
      : scenario.totalFixedCosts;
    
    const totalAdministrativeCosts = type === 'administrativeCosts'
      ? updatedCosts.reduce((sum, cost) => sum + cost.value, 0)
      : scenario.totalAdministrativeCosts;

    const operationalResult = scenario.grossProfit - totalFixedCosts - totalAdministrativeCosts;
    const operationalMargin = operationalResult / scenario.totalRevenue * 100;

    updateScenario(scenario.id, {
      [type]: updatedCosts,
      totalFixedCosts,
      totalAdministrativeCosts,
      operationalResult,
      operationalMargin
    });
  };

  const renderCostSection = (
    title: string,
    type: 'fixedCosts' | 'administrativeCosts',
    costs: CostItem[]
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{title}</CardTitle>
        <Button 
          onClick={() => addCost(type)}
          size="sm"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-1" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {costs.map((cost, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-lg bg-muted/30">
            <div className="col-span-6">
              <Input
                value={cost.name}
                onChange={(e) => updateCost(type, index, 'name', e.target.value)}
                className="text-xs"
                placeholder="Nome do custo"
              />
            </div>
            <div className="col-span-4">
              <Input
                type="number"
                value={cost.value}
                onChange={(e) => updateCost(type, index, 'value', Number(e.target.value))}
                className="text-xs"
                placeholder="Valor"
                min="0"
                step="0.01"
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <Button
                onClick={() => removeCost(type, index)}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {costs.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            Nenhum custo cadastrado. Clique em "Adicionar" para incluir custos.
          </div>
        )}
        <div className="text-right text-sm font-medium pt-2 border-t">
          Total: R$ {costs.reduce((sum, cost) => sum + cost.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {renderCostSection('Custos Fixos', 'fixedCosts', scenario.fixedCosts)}
      {renderCostSection('Custos Administrativos', 'administrativeCosts', scenario.administrativeCosts)}
    </div>
  );
}
