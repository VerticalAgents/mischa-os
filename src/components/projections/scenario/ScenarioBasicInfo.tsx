
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';

interface ScenarioBasicInfoProps {
  scenario: DREData;
}

export function ScenarioBasicInfo({ scenario }: ScenarioBasicInfoProps) {
  const { updateScenario } = useProjectionStore();

  const updateScenarioName = (name: string) => {
    updateScenario(scenario.id, { name });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informações Básicas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Cenário</label>
          <Input
            value={scenario.name}
            onChange={(e) => updateScenarioName(e.target.value)}
            className="w-full"
            placeholder="Nome do cenário"
          />
        </div>
      </CardContent>
    </Card>
  );
}
