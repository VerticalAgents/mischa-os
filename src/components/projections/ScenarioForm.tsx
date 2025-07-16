
import { DREData } from '@/types/projections';
import { DRETableHierarchical } from './DRETableHierarchical';
import { ScenarioBasicInfo } from './scenario/ScenarioBasicInfo';
import { GrowthFactorsSection } from './scenario/GrowthFactorsSection';
import { CostsManagementSection } from './scenario/CostsManagementSection';

interface ScenarioFormProps {
  scenario: DREData;
}

export function ScenarioForm({ scenario }: ScenarioFormProps) {
  return (
    <div className="space-y-6 w-full min-w-0">
      <div className="grid grid-cols-1 2xl:grid-cols-3 gap-6 w-full">
        {/* Left column - DRE Table (takes 2 columns in 2xl screens) */}
        <div className="2xl:col-span-2 min-w-0">
          <div className="w-full overflow-x-auto">
            <DRETableHierarchical dreData={scenario} />
          </div>
        </div>

        {/* Right column - Parameters (takes 1 column) */}
        <div className="space-y-4 min-w-0">
          <ScenarioBasicInfo scenario={scenario} />
          <GrowthFactorsSection scenario={scenario} />
          <CostsManagementSection scenario={scenario} />
        </div>
      </div>
    </div>
  );
}
