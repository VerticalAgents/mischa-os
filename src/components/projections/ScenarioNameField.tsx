
import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface ScenarioNameFieldProps {
  form: UseFormReturn<any>;
  updateScenarioName: (name: string) => void;
}

export function ScenarioNameField({ form, updateScenarioName }: ScenarioNameFieldProps) {
  return (
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <Input
              placeholder="Nome do cenário"
              {...field}
              onChange={(e) => updateScenarioName(e.target.value)}
              className="text-xl font-semibold border-none focus:ring-0"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
