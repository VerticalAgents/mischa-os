
import { useState } from 'react';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { 
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent 
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { DREData, Channel, CostItem, InvestmentItem } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { useClienteStore } from '@/hooks/useClienteStore';
import { DRETable } from './DRETable';
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
  const { clientes } = useClienteStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: scenario.name,
      channelGrowth: scenario.channelGrowthFactors || {
        'B2B-Revenda': { type: 'percentage', value: 0 },
        'B2B-FoodService': { type: 'percentage', value: 0 },
        'B2C-UFCSPA': { type: 'percentage', value: 0 },
        'B2C-Personalizados': { type: 'percentage', value: 0 },
        'B2C-Outros': { type: 'percentage', value: 0 }
      },
      fixedCosts: scenario.fixedCosts,
      administrativeCosts: scenario.administrativeCosts,
      investments: scenario.investments
    }
  });
  
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Recalculate the DRE based on form data
    const updatedScenario = calculateUpdatedDRE(data);
    updateScenario(scenario.id, updatedScenario);
  };
  
  const calculateUpdatedDRE = (data: z.infer<typeof formSchema>) => {
    // Start with the original channel data
    const updatedChannelsData = [...scenario.channelsData];
    
    // Apply growth factors
    Object.entries(data.channelGrowth).forEach(([channel, growth]) => {
      const channelIndex = updatedChannelsData.findIndex(c => c.channel === channel);
      if (channelIndex >= 0) {
        const originalData = updatedChannelsData[channelIndex];
        let newVolume = originalData.volume;
        
        // Apply growth factor
        if (growth.type === 'percentage') {
          newVolume = originalData.volume * (1 + growth.value / 100);
        } else {
          newVolume = originalData.volume + growth.value;
        }
        
        // Calculate new revenue and costs based on volume
        const unitPrice = originalData.revenue / originalData.volume;
        const unitCost = originalData.variableCosts / originalData.volume;
        
        const newRevenue = newVolume * unitPrice;
        const newVariableCosts = newVolume * unitCost;
        const newMargin = newRevenue - newVariableCosts;
        const newMarginPercent = (newMargin / newRevenue) * 100;
        
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
    
    // Calculate updated costs
    const totalFixedCosts = data.fixedCosts.reduce((sum, cost) => sum + cost.value, 0);
    const totalAdministrativeCosts = data.administrativeCosts.reduce((sum, cost) => sum + cost.value, 0);
    
    // Calculate investment and depreciation
    const totalInvestment = data.investments.reduce((sum, inv) => sum + inv.value, 0);
    const monthlyDepreciation = data.investments.reduce((sum, inv) => sum + (inv.value / (inv.depreciationYears * 12)), 0);
    
    // Calculate totals
    const totalRevenue = updatedChannelsData.reduce((sum, c) => sum + c.revenue, 0);
    const totalVariableCosts = updatedChannelsData.reduce((sum, c) => sum + c.variableCosts, 0);
    const totalCosts = totalVariableCosts + totalFixedCosts + totalAdministrativeCosts;
    const grossProfit = totalRevenue - totalVariableCosts;
    const grossMargin = grossProfit / totalRevenue * 100;
    const operationalResult = grossProfit - totalFixedCosts - totalAdministrativeCosts;
    const operationalMargin = operationalResult / totalRevenue * 100;
    const ebitda = operationalResult + monthlyDepreciation;
    const ebitdaMargin = ebitda / totalRevenue * 100;
    
    // Calculate break-even point
    const contributionMarginPercent = grossMargin / 100;
    const breakEvenPoint = (totalFixedCosts + totalAdministrativeCosts) / contributionMarginPercent;
    
    // Calculate payback
    const paybackMonths = operationalResult > 0 ? totalInvestment / operationalResult : 0;
    
    return {
      name: data.name,
      channelsData: updatedChannelsData,
      fixedCosts: data.fixedCosts,
      administrativeCosts: data.administrativeCosts,
      investments: data.investments,
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
      channelGrowthFactors: data.channelGrowth
    };
  };
  
  const updateScenarioName = (name: string) => {
    form.setValue('name', name);
    updateScenario(scenario.id, { name });
  };
  
  const updateGrowthFactor = (channel: Channel, type: 'percentage' | 'absolute', value: number) => {
    const channelGrowth = form.getValues('channelGrowth');
    channelGrowth[channel] = { type, value };
    form.setValue('channelGrowth', channelGrowth);
    
    // Recalculate and update
    const updatedScenario = calculateUpdatedDRE(form.getValues());
    updateScenario(scenario.id, updatedScenario);
  };
  
  const updateCosts = (type: 'fixedCosts' | 'administrativeCosts', index: number, value: number) => {
    const costs = [...form.getValues(type)];
    costs[index].value = value;
    form.setValue(type, costs);
    
    // Recalculate and update
    const updatedScenario = calculateUpdatedDRE(form.getValues());
    updateScenario(scenario.id, updatedScenario);
  };
  
  const updateInvestment = (
    index: number, 
    field: 'value' | 'depreciationYears', 
    value: number
  ) => {
    const investments = [...form.getValues('investments')];
    investments[index][field] = value;
    
    // Recalculate monthly depreciation
    investments[index].monthlyDepreciation = 
      investments[index].value / (investments[index].depreciationYears * 12);
    
    form.setValue('investments', investments);
    
    // Recalculate and update
    const updatedScenario = calculateUpdatedDRE(form.getValues());
    updateScenario(scenario.id, updatedScenario);
  };
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column - DRE Table */}
            <Card>
              <CardHeader>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Nome do cenário"
                          {...field}
                          onChange={(e) => updateScenarioName(e.target.value)}
                          className="text-xl font-semibold border-none focus:ring-0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardHeader>
              <CardContent>
                <DRETable dreData={scenario} />
              </CardContent>
            </Card>

            {/* Right column - Parameters */}
            <div className="space-y-6">
              {/* Channels Growth */}
              <Card>
                <CardHeader>
                  <CardTitle>Projeção por Canal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {scenario.channelsData.map((channelData) => {
                      const growth = form.getValues('channelGrowth')[channelData.channel];
                      return (
                        <div key={channelData.channel} className="grid grid-cols-3 gap-4 items-center">
                          <div>{channelData.channel}</div>
                          <div>
                            <select
                              value={growth.type}
                              onChange={(e) => 
                                updateGrowthFactor(
                                  channelData.channel, 
                                  e.target.value as 'percentage' | 'absolute', 
                                  growth.value
                                )
                              }
                              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                            >
                              <option value="percentage">% de crescimento</option>
                              <option value="absolute">Unidades</option>
                            </select>
                          </div>
                          <div>
                            <Input
                              type="number"
                              value={growth.value}
                              onChange={(e) => 
                                updateGrowthFactor(
                                  channelData.channel, 
                                  growth.type, 
                                  parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              {/* Accordion panels for costs */}
              <Accordion
                type="single" 
                collapsible
                value={expandedSection}
                onValueChange={setExpandedSection}
              >
                <AccordionItem value="fixed-costs">
                  <AccordionTrigger>Custos Fixos</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {form.getValues('fixedCosts').map((cost, index) => (
                        <div key={`fixed-${index}`} className="grid grid-cols-2 gap-4 items-center">
                          <div>{cost.name}</div>
                          <div>
                            <Input
                              type="number"
                              value={cost.value}
                              onChange={(e) => 
                                updateCosts('fixedCosts', index, parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="admin-costs">
                  <AccordionTrigger>Custos Administrativos</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {form.getValues('administrativeCosts').map((cost, index) => (
                        <div key={`admin-${index}`} className="grid grid-cols-2 gap-4 items-center">
                          <div>{cost.name}</div>
                          <div>
                            <Input
                              type="number"
                              value={cost.value}
                              onChange={(e) => 
                                updateCosts('administrativeCosts', index, parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="investments">
                  <AccordionTrigger>Investimentos</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4">
                      {form.getValues('investments').map((investment, index) => (
                        <div key={`invest-${index}`} className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-4">{investment.name}</div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              value={investment.value}
                              onChange={(e) => 
                                updateInvestment(index, 'value', parseFloat(e.target.value) || 0)
                              }
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              value={investment.depreciationYears}
                              onChange={(e) => 
                                updateInvestment(index, 'depreciationYears', parseInt(e.target.value) || 1)
                              }
                              placeholder="Anos"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
