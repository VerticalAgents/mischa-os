import { useState } from 'react';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DREData, Channel, CostItem, InvestmentItem } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { ModernDRETable } from './ModernDRETable';
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
export function ScenarioForm({
  scenario
}: ScenarioFormProps) {
  const {
    updateScenario
  } = useProjectionStore();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const defaultChannelGrowth: Record<Channel, {
    type: 'percentage' | 'absolute';
    value: number;
  }> = {
    'B2B-Revenda': {
      type: 'percentage',
      value: 0
    },
    'B2B-FoodService': {
      type: 'percentage',
      value: 0
    },
    'B2C-UFCSPA': {
      type: 'percentage',
      value: 0
    },
    'B2C-Personalizados': {
      type: 'percentage',
      value: 0
    },
    'B2C-Outros': {
      type: 'percentage',
      value: 0
    }
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
    const channelGrowthFactors: Record<Channel, {
      type: 'percentage' | 'absolute';
      value: number;
    }> = {
      'B2B-Revenda': {
        type: data.channelGrowth['B2B-Revenda']?.type || 'percentage',
        value: data.channelGrowth['B2B-Revenda']?.value || 0
      },
      'B2B-FoodService': {
        type: data.channelGrowth['B2B-FoodService']?.type || 'percentage',
        value: data.channelGrowth['B2B-FoodService']?.value || 0
      },
      'B2C-UFCSPA': {
        type: data.channelGrowth['B2C-UFCSPA']?.type || 'percentage',
        value: data.channelGrowth['B2C-UFCSPA']?.value || 0
      },
      'B2C-Personalizados': {
        type: data.channelGrowth['B2C-Personalizados']?.type || 'percentage',
        value: data.channelGrowth['B2C-Personalizados']?.value || 0
      },
      'B2C-Outros': {
        type: data.channelGrowth['B2C-Outros']?.type || 'percentage',
        value: data.channelGrowth['B2C-Outros']?.value || 0
      }
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
    updateScenario(scenario.id, {
      name
    });
  };
  const updateGrowthFactor = (channel: Channel, type: 'percentage' | 'absolute', value: number) => {
    const channelGrowth = form.getValues('channelGrowth');
    channelGrowth[channel] = {
      type,
      value
    };
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
  return <div className="space-y-6">
      <Form {...form}>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column - DRE Table (takes 2 columns) */}
          

          {/* Right column - Parameters (takes 1 column) */}
          
        </div>
      </Form>
    </div>;
}