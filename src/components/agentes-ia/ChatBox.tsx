import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatBoxProps = {
  agenteId: string;
  sugestoes?: string[];
  initialPrompt?: string | null;
  onMessageSent?: () => void;
};

const CHAT_URL = "https://ttguzgouurqopeccvzve.supabase.co/functions/v1/agent-chat";

export function ChatBox({ agenteId, sugestoes = [], initialPrompt, onMessageSent }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Processar prompt inicial (de quick actions)
  useEffect(() => {
    if (initialPrompt && !hasInitialized.current) {
      hasInitialized.current = true;
      const userMessage: Message = { role: "user", content: initialPrompt };
      setMessages([userMessage]);
      setIsLoading(true);
      streamChat([userMessage]).finally(() => setIsLoading(false));
    }
  }, [initialPrompt]);

  const streamChat = useCallback(
    async (userMessages: Message[]) => {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR0Z3V6Z291dXJxb3BlY2N2enZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMDI1NzEsImV4cCI6MjA2Mzc3ODU3MX0.JrJbtkh8MUA5DA5v2MSPHfb2pRaz08fU-HibNYVTHwE`,
        },
        body: JSON.stringify({
          agenteId,
          messages: userMessages,
        }),
      });

      if (response.status === 429) {
        toast.error("Limite de requisições excedido. Aguarde alguns minutos.");
        throw new Error("Rate limit");
      }

      if (response.status === 402) {
        toast.error("Créditos insuficientes. Adicione créditos no workspace.");
        throw new Error("Payment required");
      }

      if (!response.ok || !response.body) {
        throw new Error("Falha ao iniciar stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) =>
                    i === prev.length - 1 ? { ...m, content: assistantContent } : m
                  );
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    },
    [agenteId]
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      await streamChat(newMessages);
      onMessageSent?.();
    } catch (error) {
      console.error("Erro no chat:", error);
      if (!(error instanceof Error) || !["Rate limit", "Payment required"].includes(error.message)) {
        toast.error("Erro ao processar sua mensagem. Tente novamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isLoading) return;
    setInputValue(suggestion);
  };

  return (
    <Card className="h-[calc(100vh-280px)] min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <Avatar className="h-10 w-10 bg-primary">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Mischa IA</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Online • Acesso total aos dados
          </p>
        </div>
      </div>

      <CardContent className="flex-grow overflow-hidden p-0">
        <ScrollArea className="h-full px-4" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Olá! Sou a Mischa IA 👋</h3>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                Sua assistente inteligente com acesso a clientes, entregas, produção, estoque, custos e muito mais. Pergunte qualquer coisa sobre seu negócio!
              </p>
              
              {sugestoes.length > 0 && (
                <div className="w-full max-w-lg">
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">Sugestões de perguntas</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sugestoes.map((sugestao, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3 text-xs whitespace-normal"
                        onClick={() => handleSuggestionClick(sugestao)}
                      >
                        {sugestao}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {messages.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} />
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-center gap-3 text-muted-foreground p-4">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-secondary">
                      <Sparkles className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analisando dados...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            placeholder="Faça uma pergunta sobre seu negócio..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
