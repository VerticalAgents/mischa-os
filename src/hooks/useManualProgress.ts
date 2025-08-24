
import { useState, useEffect } from 'react';
import { ManualProgress } from '@/types/manual';

const STORAGE_KEY = 'mischaos-manual-progress';

export function useManualProgress() {
  const [progress, setProgress] = useState<ManualProgress>({
    completedSteps: [],
    totalProgress: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar progresso do manual:', error);
      }
    }
  }, []);

  const saveProgress = (newProgress: ManualProgress) => {
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  };

  const markStepCompleted = (stepId: string) => {
    const newCompletedSteps = [...progress.completedSteps];
    if (!newCompletedSteps.includes(stepId)) {
      newCompletedSteps.push(stepId);
    }
    
    const newProgress = {
      ...progress,
      completedSteps: newCompletedSteps,
      totalProgress: calculateTotalProgress(newCompletedSteps)
    };
    
    saveProgress(newProgress);
  };

  const markStepIncomplete = (stepId: string) => {
    const newCompletedSteps = progress.completedSteps.filter(id => id !== stepId);
    
    const newProgress = {
      ...progress,
      completedSteps: newCompletedSteps,
      totalProgress: calculateTotalProgress(newCompletedSteps)
    };
    
    saveProgress(newProgress);
  };

  const setCurrentSection = (sectionId: string) => {
    const newProgress = {
      ...progress,
      currentSection: sectionId,
      lastVisited: new Date().toISOString()
    };
    
    saveProgress(newProgress);
  };

  const calculateTotalProgress = (completedSteps: string[]) => {
    // Assumindo 50 passos totais no manual (será ajustado com base no conteúdo real)
    const totalSteps = 50;
    return Math.round((completedSteps.length / totalSteps) * 100);
  };

  const resetProgress = () => {
    const newProgress = {
      completedSteps: [],
      totalProgress: 0
    };
    saveProgress(newProgress);
  };

  return {
    progress,
    markStepCompleted,
    markStepIncomplete,
    setCurrentSection,
    resetProgress
  };
}
