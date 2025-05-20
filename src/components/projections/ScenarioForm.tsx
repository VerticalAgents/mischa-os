
import { 
  Form
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader
} from "@/components/ui/card";
import { DREData, CostItem, InvestmentItem } from '@/types/projections';
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
  
  // Ensure proper typings for the form values
  const fixedCosts = form.getValues('fixedCosts') as CostItem[];
  const administrativeCosts = form.getValues('administrativeCosts') as CostItem[];
  const investments = form.getValues('investments') as InvestmentItem[];
  
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
                fixedCosts={fixedCosts}
                administrativeCosts={administrativeCosts}
                updateCosts={updateCosts}
                expandedSection={expandedSection}
                setExpandedSection={setExpandedSection}
              />

              <InvestmentsSection 
                investments={investments}
                updateInvestment={updateInvestment}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
