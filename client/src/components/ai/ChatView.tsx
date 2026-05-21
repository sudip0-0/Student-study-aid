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
          <p className="neo-empty p-4 text-center text-xs font-bold text-muted-foreground">
            Ask questions about this document.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`max-w-[90%] rounded-neoLg border-2 border-border p-2.5 text-xs font-bold leading-relaxed shadow-neoSm ${
              msg.role === "user"
                ? "ml-auto bg-primary-soft"
                : "mr-auto bg-surface"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {mutation.isPending && (
          <div className="mr-auto max-w-[90%] rounded-neoLg border-2 border-border bg-surface p-2.5 shadow-neoSm">
            <Loader2 className="h-3 w-3 animate-spin" />
          </div>
        )}

        {error && (
          <p className="rounded-md border-2 border-border bg-danger-soft px-3 py-2 text-center text-xs font-bold text-foreground">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="mt-2 flex items-center gap-1.5 border-t-2 border-border pt-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this document..."
          className="min-h-10 flex-1 rounded-md border-2 border-border bg-surface px-2 text-xs font-bold shadow-neoSm focus:outline-none"
          disabled={mutation.isPending}
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={mutation.isPending || !input.trim()}
          className="h-8 w-8 p-0"
          aria-label="Send chat message"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
