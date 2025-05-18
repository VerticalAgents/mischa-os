
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { DRETable } from './DRETable';

export function ComparisonView() {
  const { baseDRE, scenarios, getBaseDRE } = useProjectionStore();
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(['base']);
  
  const allScenarios = [
    ...(baseDRE ? [baseDRE] : []),
    ...scenarios
  ];
  
  const handleSelectScenario = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(s => s !== id));
    } else {
      setSelectedScenarios([...selectedScenarios, id]);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {allScenarios.map((scenario) => (
          <Button
            key={scenario.id}
            variant={selectedScenarios.includes(scenario.id) ? "default" : "outline"}
            onClick={() => handleSelectScenario(scenario.id)}
            className="text-sm"
          >
            {scenario.name}
          </Button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedScenarios.map(scenarioId => {
          const scenario = allScenarios.find(s => s.id === scenarioId);
          if (!scenario) return null;
          
          return (
            <Card key={scenarioId} className="overflow-x-auto">
              <CardHeader className="py-2">
                <CardTitle className="text-base">{scenario.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <DRETable dreData={scenario} compact />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
