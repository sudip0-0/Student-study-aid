import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Loader2, Send } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { ChatMessage } from "../../types";
import { getApiErrorMessage } from "../../lib/api";
import { useAppendChatMessages, useChatHistory, useClearChatHistory } from "../../hooks";
import AIErrorRetry from "./AIErrorRetry";

interface ChatViewProps {
  fileId: string;
  mutation: UseMutationResult<string, Error, { fileId: string; messages: ChatMessage[] }>;
}

const legacyChatKey = (fileId: string) => `lumio:chat:${fileId}`;

function loadLegacyMessages(fileId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(legacyChatKey(fileId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ChatView({ fileId, mutation }: ChatViewProps) {
  const { data: serverMessages, isLoading: historyLoading } = useChatHistory(fileId);
  const appendMessages = useAppendChatMessages();
  const clearHistory = useClearChatHistory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const migratedRef = useRef<string | null>(null);

  useEffect(() => {
    setHydrated(false);
    setMessages([]);
    migratedRef.current = null;
  }, [fileId]);

  useEffect(() => {
    if (historyLoading || hydrated) return;

    if (serverMessages && serverMessages.length > 0) {
      setMessages(serverMessages);
      localStorage.removeItem(legacyChatKey(fileId));
      setHydrated(true);
      return;
    }

    const legacy = loadLegacyMessages(fileId);
    if (legacy.length > 0 && migratedRef.current !== fileId) {
      migratedRef.current = fileId;
      setMessages(legacy);
      appendMessages.mutate(
        { fileId, messages: legacy },
        {
          onSuccess: () => localStorage.removeItem(legacyChatKey(fileId)),
        }
      );
    }
    setHydrated(true);
  }, [fileId, historyLoading, serverMessages, hydrated, appendMessages]);

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

    mutation.mutate(
      { fileId, messages: updatedMessages },
      {
        onSuccess: (reply) => {
          const assistantMsg: ChatMessage = { role: "assistant", content: reply };
          setMessages((prev) => [...prev, assistantMsg]);
          appendMessages.mutate({
            fileId,
            messages: [userMsg, assistantMsg],
          });
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

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(legacyChatKey(fileId));
    clearHistory.mutate(fileId);
  };

  return (
    <div className="flex h-full max-h-[450px] flex-col">
      <div className="mb-2 flex shrink-0 justify-end">
        {messages.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        {historyLoading && !hydrated && (
          <p className="p-4 text-center text-xs font-bold text-muted-foreground">Loading chat...</p>
        )}

        {hydrated && messages.length === 0 && (
          <p className="neo-empty p-4 text-center text-xs font-bold text-muted-foreground">
            Ask questions about this document. Your conversation is saved for this file.
          </p>
        )}

        {messages.map((msg, i) => (
          <div
            key={`${msg.role}-${i}-${msg.content.slice(0, 12)}`}
            className={`max-w-[90%] rounded-neoLg border-2 border-border p-2.5 text-xs font-bold leading-relaxed shadow-neoSm ${
              msg.role === "user" ? "ml-auto bg-primary-soft" : "mr-auto bg-surface"
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

        {mutation.isError && (
          <AIErrorRetry
            message={getApiErrorMessage(mutation.error, "Failed to send message")}
            onRetry={() => mutation.mutate({ fileId, messages })}
            disabled={mutation.isPending || messages.length === 0}
          />
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
