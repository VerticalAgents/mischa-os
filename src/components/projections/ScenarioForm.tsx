
import { useState } from 'react';
import { 
  Form
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { DREData } from '@/types/projections';
import { DRETable } from './DRETable';
import { ChannelGrowthSection } from './ChannelGrowthSection';
import { CostsSection } from './CostsSection';
import { InvestmentsSection } from './InvestmentsSection';
import { ScenarioNameField } from './ScenarioNameField';
import { useScenarioFormCalculations } from './useScenarioFormCalculations';

interface ScenarioFormProps {
  scenario: DREData;
}

export function ScenarioForm({ scenario }: ScenarioFormProps) {
  const {
    form,
    expandedSection,
    setExpandedSection,
    updateScenarioName,
    updateGrowthFactor,
    updateCosts,
    updateInvestment,
    getGrowthValue,
    onSubmit
  } = useScenarioFormCalculations(scenario);
  
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <ScenarioNameField 
                  form={form} 
                  updateScenarioName={updateScenarioName} 
                />
              </CardHeader>
              <CardContent>
                <DRETable dreData={scenario} />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <ChannelGrowthSection 
                channelsData={scenario.channelsData} 
                updateGrowthFactor={updateGrowthFactor}
                getGrowthValue={getGrowthValue}
              />
              
              <CostsSection 
                fixedCosts={form.getValues('fixedCosts')} 
                administrativeCosts={form.getValues('administrativeCosts')}
                updateCosts={updateCosts}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              />

              <InvestmentsSection 
                investments={form.getValues('investments')}
                updateInvestment={updateInvestment}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
