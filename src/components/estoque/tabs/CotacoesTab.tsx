
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function CotacoesTab() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Construction className="h-6 w-6 text-orange-500" />
            Em Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            🚧 Esta funcionalidade está em desenvolvimento.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Em breve você poderá gerenciar cotações de fornecedores aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
