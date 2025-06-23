
import { useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DREData } from '@/types/projections';
import { useProjectionStore } from '@/hooks/useProjectionStore';
import { DRETableHierarchical } from './DRETableHierarchical';
import { ScenarioForm } from './ScenarioForm';

export function ScenarioTabs() {
  const { baseDRE, scenarios, activeScenarioId, createScenario, duplicateScenario, deleteScenario, setActiveScenario } = useProjectionStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');

  const handleCreateScenario = () => {
    if (newScenarioName.trim()) {
      createScenario(newScenarioName.trim());
      setNewScenarioName('');
      setIsCreateDialogOpen(false);
    }
  };

  const handleDuplicateScenario = () => {
    if (activeScenarioId) {
      duplicateScenario(activeScenarioId);
    }
  };

  const handleDeleteScenario = () => {
    if (activeScenarioId && activeScenarioId !== 'base') {
      deleteScenario(activeScenarioId);
    }
  };

  const allScenarios: DREData[] = [
    ...(baseDRE ? [baseDRE] : []),
    ...scenarios
  ];

  return (
    <>
      <Tabs 
        value={activeScenarioId || 'base'}
        onValueChange={setActiveScenario}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-6">
          <TabsList className="flex-grow max-w-2xl">
            <TabsTrigger value="base" className="flex-grow">DRE Base</TabsTrigger>
            {scenarios.map((scenario) => (
              <TabsTrigger key={scenario.id} value={scenario.id} className="flex-grow">
                {scenario.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex gap-2 ml-4">
            <Button size="sm" variant="outline" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Novo Cenário
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDuplicateScenario}
              disabled={!activeScenarioId}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDeleteScenario}
              disabled={!activeScenarioId || activeScenarioId === 'base'}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>

        <TabsContent value="base">
          <div className="space-y-6">
            {baseDRE && <DRETableHierarchical dreData={baseDRE} />}
          </div>
        </TabsContent>
        
        {scenarios.map((scenario) => (
          <TabsContent key={scenario.id} value={scenario.id}>
            <div className="space-y-6">
              <DRETableHierarchical dreData={scenario} />
              <ScenarioForm scenario={scenario} />
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Cenário</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Nome do cenário"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateScenario}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
