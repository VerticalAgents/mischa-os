
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { CostItem } from '@/types/projections';

interface CostsSectionProps {
  fixedCosts: CostItem[];
  administrativeCosts: CostItem[];
  updateCosts: (type: 'fixedCosts' | 'administrativeCosts', index: number, value: number) => void;
  expandedSection: string | null;
  setExpandedSection: (value: string | null) => void;
}

export function CostsSection({
  fixedCosts,
  administrativeCosts,
  updateCosts,
  expandedSection,
  setExpandedSection
}: CostsSectionProps) {
  return (
    <Accordion
      type="single" 
      collapsible
      value={expandedSection}
      onValueChange={setExpandedSection}
    >
      <AccordionItem value="fixed-costs">
        <AccordionTrigger>Custos Fixos</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {fixedCosts.map((cost, index) => (
              <div key={`fixed-${index}`} className="grid grid-cols-2 gap-4 items-center">
                <div>{cost.name}</div>
                <div>
                  <Input
                    type="number"
                    value={cost.value}
                    onChange={(e) => 
                      updateCosts('fixedCosts', index, parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="admin-costs">
        <AccordionTrigger>Custos Administrativos</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            {administrativeCosts.map((cost, index) => (
              <div key={`admin-${index}`} className="grid grid-cols-2 gap-4 items-center">
                <div>{cost.name}</div>
                <div>
                  <Input
                    type="number"
                    value={cost.value}
                    onChange={(e) => 
                      updateCosts('administrativeCosts', index, parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
