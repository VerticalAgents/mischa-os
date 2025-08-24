
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Trophy } from 'lucide-react';
import { ManualSection as ManualSectionType } from '@/types/manual';
import ManualStep from './ManualStep';

interface ManualSectionProps {
  section: ManualSectionType;
  completedSteps: string[];
  onToggleStep: (stepId: string, completed: boolean) => void;
}

export default function ManualSection({ section, completedSteps, onToggleStep }: ManualSectionProps) {
  const completedStepsInSection = section.steps.filter(step => 
    completedSteps.includes(step.id)
  ).length;
  
  const progressPercentage = (completedStepsInSection / section.steps.length) * 100;
  const isCompleted = completedStepsInSection === section.steps.length;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'iniciante': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'intermediario': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
      case 'avancado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className={`${isCompleted ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''}`}>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-lg ${section.color} flex items-center justify-center flex-shrink-0`}>
                {section.icon}
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  {section.title}
                  {isCompleted && <Trophy className="h-5 w-5 text-yellow-500" />}
                </CardTitle>
                <p className="text-muted-foreground mt-1">{section.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className={getDifficultyColor(section.difficulty)}>
                {section.difficulty}
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {section.estimatedTime}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                Progresso: {completedStepsInSection} de {section.steps.length} passos
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {section.steps.map((step, index) => (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                completedSteps.includes(step.id) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < section.steps.length - 1 && (
                <div className="w-px h-12 bg-border mt-2" />
              )}
            </div>
            <div className="flex-1">
              <ManualStep
                step={step}
                isCompleted={completedSteps.includes(step.id)}
                onToggleComplete={onToggleStep}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
