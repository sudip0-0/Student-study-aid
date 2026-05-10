import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Loader2, Send } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ChatMessage } from "../../types";

interface ChatViewProps {
  fileId: string;
  mutation: UseMutationResult<string, Error, { fileId: string; messages: ChatMessage[] }>;
}

export default function ChatView({ fileId, mutation }: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setError(null);

    mutation.mutate(
      { fileId, messages: updatedMessages },
      {
        onSuccess: (reply) => {
          setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
        },
        onError: (err: Error) => {
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[450px]">
      <div className="flex-1 overflow-auto space-y-3 pr-1">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Ask questions about this document.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs leading-relaxed rounded-lg p-2.5 max-w-[90%] ${
              msg.role === "user"
                ? "bg-primary/10 ml-auto"
                : "bg-muted mr-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {mutation.isPending && (
          <div className="bg-muted rounded-lg p-2.5 max-w-[90%] mr-auto">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )}

        {error && (
          <p className="text-xs text-destructive text-center">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t mt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this document..."
          className="flex-1 h-8 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          disabled={mutation.isPending}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={mutation.isPending || !input.trim()}
          className="h-8 w-8 p-0"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
