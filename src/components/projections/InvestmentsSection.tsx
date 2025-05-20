
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { InvestmentItem } from '@/types/projections';

interface InvestmentsSectionProps {
  investments: InvestmentItem[];
  updateInvestment: (index: number, field: 'value' | 'depreciationYears', value: number) => void;
}

export function InvestmentsSection({ investments, updateInvestment }: InvestmentsSectionProps) {
  return (
    <AccordionItem value="investments">
      <AccordionTrigger>Investimentos</AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          {investments.map((investment, index) => (
            <div key={`invest-${index}`} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-4">{investment.name}</div>
              <div className="col-span-4">
                <Input
                  type="number"
                  value={investment.value}
                  onChange={(e) => 
                    updateInvestment(index, 'value', parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="col-span-4">
                <Input
                  type="number"
                  value={investment.depreciationYears}
                  onChange={(e) => 
                    updateInvestment(index, 'depreciationYears', parseInt(e.target.value) || 1)
                  }
                  placeholder="Anos"
                />
              </div>
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
