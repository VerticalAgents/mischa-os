
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send } from "lucide-react";
import { FormEvent, useState } from "react";

export function ChatBox() {
  const [inputValue, setInputValue] = useState("");
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Esta funcionalidade seria implementada com a integração n8n
    console.log("Mensagem enviada:", inputValue);
    setInputValue("");
  };
  
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Chat com o Agente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow overflow-auto flex items-center justify-center bg-muted/20">
        <div className="text-center p-6">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-lg">
            Chat em desenvolvimento – integração futura via n8n
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Este espaço será utilizado para interagir diretamente com o agente, permitindo consultas 
            e recebendo análises personalizadas com base nos dados da sua empresa.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Digite sua mensagem para o agente..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
