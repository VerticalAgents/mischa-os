import { useState } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DREData, Channel, CostItem, InvestmentItem } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { DRETableHierarchical } from './DRETableHierarchical';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface ScenarioFormProps {
  scenario: DREData;
}

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  channelGrowth: z.record(z.object({
    type: z.enum(['percentage', 'absolute']),
    value: z.number()
  })),
  fixedCosts: z.array(z.object({
    name: z.string(),
    value: z.number().min(0)
  })),
  administrativeCosts: z.array(z.object({
    name: z.string(),
    value: z.number().min(0)
  })),
  investments: z.array(z.object({
    name: z.string(),
    value: z.number().min(0),
    depreciationYears: z.number().min(1),
    monthlyDepreciation: z.number()
  }))
});

export function ScenarioForm({ scenario }: ScenarioFormProps) {
  const { updateScenario } = useProjectionStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const defaultChannelGrowth: Record<Channel, { type: 'percentage' | 'absolute'; value: number; }> = {
    'B2B-Revenda': { type: 'percentage', value: 0 },
    'B2B-FoodService': { type: 'percentage', value: 0 },
    'B2C-UFCSPA': { type: 'percentage', value: 0 },
    'B2C-Personalizados': { type: 'percentage', value: 0 },
    'B2C-Outros': { type: 'percentage', value: 0 }
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: scenario.name,
      channelGrowth: scenario.channelGrowthFactors || defaultChannelGrowth,
      fixedCosts: scenario.fixedCosts,
      administrativeCosts: scenario.administrativeCosts,
      investments: scenario.investments
    }
  });

  const calculateUpdatedDRE = (data: z.infer<typeof formSchema>) => {
    const updatedChannelsData = [...scenario.channelsData];

    Object.entries(data.channelGrowth).forEach(([channel, growth]) => {
      const channelIndex = updatedChannelsData.findIndex(c => c.channel === channel);
      if (channelIndex >= 0) {
        const originalData = updatedChannelsData[channelIndex];
        let newVolume = originalData.volume;

        if (growth.type === 'percentage') {
          newVolume = originalData.volume * (1 + growth.value / 100);
        } else {
          newVolume = originalData.volume + growth.value;
        }

        const unitPrice = originalData.revenue / originalData.volume;
        const unitCost = originalData.variableCosts / originalData.volume;
        const newRevenue = newVolume * unitPrice;
        const newVariableCosts = newVolume * unitCost;
        const newMargin = newRevenue - newVariableCosts;
        const newMarginPercent = newMargin / newRevenue * 100;

        updatedChannelsData[channelIndex] = {
          ...originalData,
          volume: newVolume,
          revenue: newRevenue,
          variableCosts: newVariableCosts,
          margin: newMargin,
          marginPercent: newMarginPercent
        };
      }
    });

    const totalFixedCosts = data.fixedCosts.reduce((sum, cost) => sum + cost.value, 0);
    const totalAdministrativeCosts = data.administrativeCosts.reduce((sum, cost) => sum + cost.value, 0);
    const totalInvestment = data.investments.reduce((sum, inv) => sum + inv.value, 0);
    const monthlyDepreciation = data.investments.reduce((sum, inv) => sum + inv.value / (inv.depreciationYears * 12), 0);

    const totalRevenue = updatedChannelsData.reduce((sum, c) => sum + c.revenue, 0);
    const totalVariableCosts = updatedChannelsData.reduce((sum, c) => sum + c.variableCosts, 0);
    const totalCosts = totalVariableCosts + totalFixedCosts + totalAdministrativeCosts;
    const grossProfit = totalRevenue - totalVariableCosts;
    const grossMargin = grossProfit / totalRevenue * 100;
    const operationalResult = grossProfit - totalFixedCosts - totalAdministrativeCosts;
    const operationalMargin = operationalResult / totalRevenue * 100;
    const ebitda = operationalResult + monthlyDepreciation;
    const ebitdaMargin = ebitda / totalRevenue * 100;
    const contributionMarginPercent = grossMargin / 100;
    const breakEvenPoint = (totalFixedCosts + totalAdministrativeCosts) / contributionMarginPercent;
    const paybackMonths = operationalResult > 0 ? totalInvestment / operationalResult : 0;

    const channelGrowthFactors: Record<Channel, { type: 'percentage' | 'absolute'; value: number; }> = {
      'B2B-Revenda': { type: data.channelGrowth['B2B-Revenda']?.type || 'percentage', value: data.channelGrowth['B2B-Revenda']?.value || 0 },
      'B2B-FoodService': { type: data.channelGrowth['B2B-FoodService']?.type || 'percentage', value: data.channelGrowth['B2B-FoodService']?.value || 0 },
      'B2C-UFCSPA': { type: data.channelGrowth['B2C-UFCSPA']?.type || 'percentage', value: data.channelGrowth['B2C-UFCSPA']?.value || 0 },
      'B2C-Personalizados': { type: data.channelGrowth['B2C-Personalizados']?.type || 'percentage', value: data.channelGrowth['B2C-Personalizados']?.value || 0 },
      'B2C-Outros': { type: data.channelGrowth['B2C-Outros']?.type || 'percentage', value: data.channelGrowth['B2C-Outros']?.value || 0 }
    };

    const updatedScenario: Partial<DREData> = {
      name: data.name,
      channelsData: updatedChannelsData,
      fixedCosts: data.fixedCosts as CostItem[],
      administrativeCosts: data.administrativeCosts as CostItem[],
      investments: data.investments as InvestmentItem[],
      totalRevenue,
      totalVariableCosts,
      totalFixedCosts,
      totalAdministrativeCosts,
      totalCosts,
      grossProfit,
      grossMargin,
      operationalResult,
      operationalMargin,
      totalInvestment,
      monthlyDepreciation,
      ebitda,
      ebitdaMargin,
      breakEvenPoint,
      paybackMonths,
      channelGrowthFactors
    };

    return updatedScenario;
  };

  const updateScenarioName = (name: string) => {
    form.setValue('name', name);
    updateScenario(scenario.id, { name });
  };

  const updateGrowthFactor = (channel: Channel, type: 'percentage' | 'absolute', value: number) => {
    const channelGrowth = form.getValues('channelGrowth');
    channelGrowth[channel] = { type, value };
    form.setValue('channelGrowth', channelGrowth);
    const updatedScenario = calculateUpdatedDRE(form.getValues());
    updateScenario(scenario.id, updatedScenario);
  };

  const updateCosts = (type: 'fixedCosts' | 'administrativeCosts', index: number, value: number) => {
    const costs = [...form.getValues(type)];
    costs[index].value = value;
    form.setValue(type, costs);
    const updatedScenario = calculateUpdatedDRE(form.getValues());
    updateScenario(scenario.id, updatedScenario);
  };

  const updateInvestment = (index: number, field: 'value' | 'depreciationYears', value: number) => {
    const investments = [...form.getValues('investments')];
    investments[index][field] = value;
    investments[index].monthlyDepreciation = investments[index].value / (investments[index].depreciationYears * 12);
    form.setValue('investments', investments);
    const updatedScenario = calculateUpdatedDRE(form.getValues());
    updateScenario(scenario.id, updatedScenario);
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <Form {...form}>
        <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 w-full">
          {/* Left column - DRE Table (takes 2 columns in 2xl screens) */}
          <div className="2xl:col-span-2 min-w-0">
            <div className="w-full overflow-x-auto">
              <DRETableHierarchical dreData={scenario} />
            </div>
          </div>

          {/* Right column - Parameters (takes 1 column) */}
          <div className="space-y-4 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parâmetros do Cenário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome do Cenário</label>
                  <Input
                    value={form.watch('name')}
                    onChange={(e) => updateScenarioName(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Accordion type="single" collapsible value={expandedSection || ''} onValueChange={setExpandedSection}>
                  <AccordionItem value="growth">
                    <AccordionTrigger className="text-sm font-medium">
                      Fatores de Crescimento por Canal
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {Object.entries(form.watch('channelGrowth')).map(([channel, growth]) => (
                        <div key={channel} className="space-y-2 p-3 border rounded-md">
                          <label className="text-xs font-medium text-muted-foreground truncate block">
                            {channel}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={growth.type}
                              onChange={(e) => updateGrowthFactor(channel as Channel, e.target.value as 'percentage' | 'absolute', growth.value)}
                              className="text-xs border rounded px-2 py-1 w-full"
                            >
                              <option value="percentage">%</option>
                              <option value="absolute">Absoluto</option>
                            </select>
                            <Input
                              type="number"
                              value={growth.value}
                              onChange={(e) => updateGrowthFactor(channel as Channel, growth.type, Number(e.target.value))}
                              className="text-xs w-full"
                              step="0.1"
                            />
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="fixed-costs">
                    <AccordionTrigger className="text-sm font-medium">
                      Custos Fixos
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {form.watch('fixedCosts').map((cost, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2 text-xs">
                          <span className="truncate" title={cost.name}>{cost.name}</span>
                          <Input
                            type="number"
                            value={cost.value}
                            onChange={(e) => updateCosts('fixedCosts', index, Number(e.target.value))}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="admin-costs">
                    <AccordionTrigger className="text-sm font-medium">
                      Custos Administrativos
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2">
                      {form.watch('administrativeCosts').map((cost, index) => (
                        <div key={index} className="grid grid-cols-2 gap-2 text-xs">
                          <span className="truncate" title={cost.name}>{cost.name}</span>
                          <Input
                            type="number"
                            value={cost.value}
                            onChange={(e) => updateCosts('administrativeCosts', index, Number(e.target.value))}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="investments">
                    <AccordionTrigger className="text-sm font-medium">
                      Investimentos
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3">
                      {form.watch('investments').map((investment, index) => (
                        <div key={index} className="space-y-2 p-3 border rounded-md">
                          <label className="text-xs font-medium truncate block" title={investment.name}>
                            {investment.name}
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground">Valor</label>
                              <Input
                                type="number"
                                value={investment.value}
                                onChange={(e) => updateInvestment(index, 'value', Number(e.target.value))}
                                className="text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground">Anos Deprec.</label>
                              <Input
                                type="number"
                                value={investment.depreciationYears}
                                onChange={(e) => updateInvestment(index, 'depreciationYears', Number(e.target.value))}
                                className="text-xs"
                                min="1"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </Form>
    </div>
  );
}
