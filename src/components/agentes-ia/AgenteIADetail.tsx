
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AgenteIA } from "./agentes-data";
import { ChatBox } from "./ChatBox";

type AgenteIADetailProps = {
  agente: AgenteIA;
};

export default function AgenteIADetail({ agente }: AgenteIADetailProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {agente.icon}
          <h2 className="text-2xl font-bold">{agente.nome}</h2>
        </div>
        
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-800">
          Chat ainda não integrado – integração futura via n8n
        </Badge>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Sobre este agente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{agente.instrucoes}</p>
          
          <div className="mt-6">
            <h3 className="font-medium mb-2">Sugestões de perguntas:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {agente.sugestoesPergunta.map((pergunta, index) => (
                <li key={index}>{pergunta}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Separator />
      
      <ChatBox />
    </div>
  );
}
