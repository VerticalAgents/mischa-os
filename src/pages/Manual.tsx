
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, Download } from 'lucide-react';
import { manualSections } from '@/data/manualData';
import { useManualProgress } from '@/hooks/useManualProgress';
import ManualNavigation from '@/components/manual/ManualNavigation';
import ManualSection from '@/components/manual/ManualSection';
import ManualSearch from '@/components/manual/ManualSearch';
import { useToast } from '@/hooks/use-toast';

export default function Manual() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    progress,
    markStepCompleted,
    markStepIncomplete,
    setCurrentSection,
    resetProgress
  } = useManualProgress();

  const [currentSection, setCurrentSectionLocal] = useState(
    sectionId || manualSections[0]?.id || 'primeiros-passos'
  );

  useEffect(() => {
    if (sectionId && manualSections.find(s => s.id === sectionId)) {
      setCurrentSectionLocal(sectionId);
      setCurrentSection(sectionId);
    }
  }, [sectionId, setCurrentSection]);

  const handleSectionChange = (newSectionId: string) => {
    setCurrentSectionLocal(newSectionId);
    setCurrentSection(newSectionId);
    navigate(`/manual/${newSectionId}`, { replace: true });
  };

  const handleToggleStep = (stepId: string, completed: boolean) => {
    if (completed) {
      markStepCompleted(stepId);
      toast({
        title: "Passo concluído!",
        description: "Seu progresso foi salvo automaticamente.",
      });
    } else {
      markStepIncomplete(stepId);
    }
  };

  const handleSearchResultClick = (sectionId: string, stepId: string) => {
    handleSectionChange(sectionId);
    // Scroll to step after a short delay to ensure section is loaded
    setTimeout(() => {
      const stepElement = document.getElementById(`step-${stepId}`);
      if (stepElement) {
        stepElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleResetProgress = () => {
    if (confirm('Tem certeza que deseja resetar todo o progresso? Esta ação não pode ser desfeita.')) {
      resetProgress();
      toast({
        title: "Progresso resetado",
        description: "Todo o progresso do manual foi resetado.",
      });
    }
  };

  const currentSectionData = manualSections.find(s => s.id === currentSection);

  if (!currentSectionData) {
    return (
      <div className="container mx-auto py-6">
        <p>Seção não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <ManualNavigation
        currentSection={currentSection}
        completedSteps={progress.completedSteps}
        onSectionChange={handleSectionChange}
      />

      <div className="flex-1 flex flex-col">
        <header className="border-b bg-background p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => navigate('/home')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Início
              </Button>
              <h1 className="text-2xl font-bold">Manual de Instruções</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleResetProgress}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar Progresso
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ManualSearch onResultClick={handleSearchResultClick} />
            </div>
            <div className="flex items-center gap-4 min-w-0">
              <div className="text-sm text-muted-foreground">
                Progresso geral: {progress.totalProgress}%
              </div>
              <Progress value={progress.totalProgress} className="w-32" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <ManualSection
              section={currentSectionData}
              completedSteps={progress.completedSteps}
              onToggleStep={handleToggleStep}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
