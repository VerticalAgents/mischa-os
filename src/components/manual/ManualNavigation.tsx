
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight, Trophy } from 'lucide-react';
import { manualSections } from '@/data/manualData';
import { cn } from '@/lib/utils';

interface ManualNavigationProps {
  currentSection: string;
  completedSteps: string[];
  onSectionChange: (sectionId: string) => void;
}

export default function ManualNavigation({ 
  currentSection, 
  completedSteps, 
  onSectionChange 
}: ManualNavigationProps) {
  const getSectionProgress = (sectionId: string) => {
    const section = manualSections.find(s => s.id === sectionId);
    if (!section) return 0;
    
    const completedInSection = section.steps.filter(step => 
      completedSteps.includes(step.id)
    ).length;
    
    return (completedInSection / section.steps.length) * 100;
  };

  const isSectionCompleted = (sectionId: string) => {
    return getSectionProgress(sectionId) === 100;
  };

  return (
    <div className="w-80 border-r bg-muted/20 p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Manual de Instruções</h2>
        <p className="text-sm text-muted-foreground">
          Guia completo para dominar o MischaOS
        </p>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <nav className="space-y-2">
          {manualSections.map((section) => {
            const progress = getSectionProgress(section.id);
            const isCompleted = isSectionCompleted(section.id);
            const isActive = currentSection === section.id;

            return (
              <Button
                key={section.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-3 text-left",
                  isActive && "bg-accent"
                )}
                onClick={() => onSectionChange(section.id)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center flex-shrink-0`}>
                    {section.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{section.title}</span>
                      {isCompleted && <Trophy className="h-4 w-4 text-yellow-500" />}
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {section.description}
                    </p>
                    <div className="space-y-1">
                      <Progress value={progress} className="h-1" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {Math.round(progress)}% concluído
                        </span>
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {section.estimatedTime}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
    </div>
  );
}
