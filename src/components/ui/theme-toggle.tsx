
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/lib/theme";
import { Toggle } from "@/components/ui/toggle";

export function ThemeToggle({
  variant = "outline",
  size = "default",
  className = "",
}: {
  variant?: "outline" | "ghost" | "default" | "link" | "secondary" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <Button 
      variant={variant} 
      size={size} 
      onClick={toggleTheme} 
      className={className}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
