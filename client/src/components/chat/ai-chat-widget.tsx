import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Send, Bot, User, X, Minimize2 } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatResponse {
  response: string;
  analysis: {
    portfolioInsights?: string;
    marketContext?: string;
    recommendations?: string[];
  };
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I'm your AI financial advisor. I can analyze your portfolio, provide market insights, and answer questions about your investments. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get user's portfolio and watchlist data for context
  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolio"],
    enabled: isOpen,
  });

  const { data: watchlist } = useQuery({
    queryKey: ["/api/watchlist"],
    enabled: isOpen,
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      const response = await fetch("/api/chat/analyze", {
        method: "POST",
        body: JSON.stringify({
          message,
          portfolio,
          watchlist,
        }),
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    },
    onSuccess: (response, message) => {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        role: "user",
        timestamp: new Date(),
      };

      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage, aiMessage]);
      setInputValue("");
    },
  });

  const handleSendMessage = () => {
    if (!inputValue.trim() || chatMutation.isPending) return;
    
    chatMutation.mutate(inputValue.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        data-testid="button-open-chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 w-96 h-[500px] shadow-xl z-50 flex flex-col",
      isMinimized && "h-16"
    )}>
      <CardHeader className="flex flex-row items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-sm font-medium">AI Financial Advisor</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0"
            data-testid="button-minimize-chat"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-8 w-8 p-0"
            data-testid="button-close-chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === "user" && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.role === "user" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted"
                    )}>
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[280px] rounded-lg p-3 text-sm",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    )}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {chatMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about your portfolio, market trends..."
                className="flex-1"
                disabled={chatMutation.isPending}
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                size="sm"
                disabled={!inputValue.trim() || chatMutation.isPending}
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}