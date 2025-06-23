
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { DRETableHierarchical } from './DRETableHierarchical';

export function ComparisonView() {
  const { baseDRE, scenarios } = useProjectionStore();
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
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Cenários para Comparação</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
        {selectedScenarios.map(scenarioId => {
          const scenario = allScenarios.find(s => s.id === scenarioId);
          if (!scenario) return null;
          
          return (
            <div key={scenarioId} className="h-full">
              <DRETableHierarchical 
                dreData={scenario} 
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
