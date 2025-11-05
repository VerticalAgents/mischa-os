
import { DREData } from '@/types/projections';
import { ScenarioBasicInfo } from './scenario/ScenarioBasicInfo';
import { GrowthFactorsSection } from './scenario/GrowthFactorsSection';
import { CostsManagementSection } from './scenario/CostsManagementSection';

interface ScenarioFormProps {
  scenario: DREData;
}

export function ScenarioForm({ scenario }: ScenarioFormProps) {
  return (
    <div className="space-y-6 w-full min-w-0">
      <ScenarioBasicInfo scenario={scenario} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <GrowthFactorsSection scenario={scenario} />
        <CostsManagementSection scenario={scenario} />
      </div>
    </div>
  );
}
