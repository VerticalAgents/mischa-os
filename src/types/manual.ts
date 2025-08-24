
import { ReactNode } from 'react';

export interface ManualStep {
  id: string;
  title: string;
  description: string;
  actionUrl?: string;
  screenshots?: string[];
  tips?: string[];
  completed?: boolean;
}

export interface ManualSection {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  steps: ManualStep[];
  estimatedTime: string;
  difficulty: 'iniciante' | 'intermediario' | 'avancado';
  color: string;
}

export interface ManualProgress {
  completedSteps: string[];
  currentSection?: string;
  lastVisited?: string;
  totalProgress: number;
}
