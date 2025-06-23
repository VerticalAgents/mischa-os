
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
    <div className="space-y-6 w-full min-w-0">
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
                className="text-sm whitespace-nowrap"
              >
                {scenario.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Grid responsivo para comparação */}
      <div className="w-full min-w-0">
        {selectedScenarios.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Selecione ao menos um cenário para visualizar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 w-full">
            {/* Layout responsivo baseado na quantidade de cenários */}
            <div className={`
              grid gap-6 w-full
              ${selectedScenarios.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto' : 
                selectedScenarios.length === 2 ? 'grid-cols-1 xl:grid-cols-2' :
                'grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'}
            `}>
              {selectedScenarios.map(scenarioId => {
                const scenario = allScenarios.find(s => s.id === scenarioId);
                if (!scenario) return null;
                
                return (
                  <div key={scenarioId} className="min-w-0 w-full">
                    <div className="w-full overflow-x-auto">
                      <DRETableHierarchical 
                        dreData={scenario} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
