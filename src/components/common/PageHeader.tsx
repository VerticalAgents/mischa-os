
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type PageHeaderProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  backLink?: string;  // Added backLink property
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
  icon,
  backLink,  // Added backLink parameter
  action, 
  children,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8", className)}>
      <div className="text-left">
        {backLink && (
          <Link to={backLink} className="flex items-center text-muted-foreground hover:text-foreground mb-2 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Voltar</span>
          </Link>
        )}
        <div className="flex items-center gap-2">
          {icon && icon}
          <h1 className="text-3xl font-bold tracking-tight text-left">{title}</h1>
        </div>
        {description && <p className="text-muted-foreground mt-1 text-left">{description}</p>}
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
