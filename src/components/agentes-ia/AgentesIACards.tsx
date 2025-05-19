
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { agentesIA } from "./agentes-data";

export default function AgentesIACards() {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agentesIA.map((agente) => (
        <Card key={agente.id} className="flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              {agente.icon}
              <CardTitle className="text-xl">{agente.nome}</CardTitle>
            </div>
            <CardDescription className="text-base">{agente.descricao}</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {agente.recursos.map((recurso, index) => (
                <li key={index}>{recurso}</li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => navigate(`/agentes-ia/${agente.id}`)}
            >
              Acessar Agente
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
