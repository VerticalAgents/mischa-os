
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;  // Added icon property as ReactNode
  action?: {
    label: string;
    onClick: () => void;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  };
  children?: ReactNode;
  className?: string;
};

export default function PageHeader({ 
  title, 
  description, 
  icon,  // Added icon parameter
  action, 
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div>
        <div className="flex items-center gap-2">
          {icon && icon}  {/* Render icon if provided */}
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {children}
        {action && (
          <Button 
            onClick={action.onClick}
            variant={action.variant || "default"}
          >
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
