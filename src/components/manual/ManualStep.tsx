
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { ManualStep as ManualStepType } from '@/types/manual';
import { Link } from 'react-router-dom';

interface ManualStepProps {
  step: ManualStepType;
  isCompleted: boolean;
  onToggleComplete: (stepId: string, completed: boolean) => void;
}

export default function ManualStep({ step, isCompleted, onToggleComplete }: ManualStepProps) {
  const handleCheckboxChange = (checked: boolean) => {
    onToggleComplete(step.id, checked);
  };

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleCheckboxChange}
            className="mt-1"
          />
          <div className="flex-1">
            <CardTitle className={`text-lg ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {step.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {step.description}
            </p>
          </div>
          {isCompleted && (
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Concluído
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {step.actionUrl && (
          <div className="mb-3">
            <Button asChild variant="outline" size="sm">
              <Link to={step.actionUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir para funcionalidade
              </Link>
            </Button>
          </div>
        )}

        {step.tips && step.tips.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Dicas importantes:</p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-600 dark:text-blue-400 mt-1">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
