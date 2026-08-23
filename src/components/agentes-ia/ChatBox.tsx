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
      sendChat([userMessage]).finally(() => setIsLoading(false));
    }
  }, [initialPrompt]);

  const sendChat = useCallback(
    async (userMessages: Message[]) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast.error("Sessão expirada. Faça login novamente.");
        throw new Error("Unauthenticated");
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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

      if (response.status === 401 || response.status === 403) {
        toast.error("Você não tem permissão para usar a Mischa IA.");
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error("Falha ao processar mensagem");
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantContent = data.content || "Desculpe, não consegui processar sua solicitação.";
      
      setMessages((prev) => [...prev, { role: "assistant", content: assistantContent }]);
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
      await sendChat(newMessages);
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
