import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";

interface SummaryViewProps {
  fileId: string;
  mutation: UseMutationResult<string, Error, { fileId: string; length?: "short" | "medium" | "long" }>;
}

export default function SummaryView({ fileId, mutation }: SummaryViewProps) {
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    mutation.mutate(
      { fileId, length },
      {
        onSuccess: (data) => setResult(data),
        onError: (err: Error) => {
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={length}
          onChange={(e) => setLength(e.target.value as "short" | "medium" | "long")}
          className="min-h-10 rounded-md border-2 border-border bg-surface px-2 font-mono text-xs font-bold shadow-neoSm"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleGenerate}
          disabled={mutation.isPending}
          className="h-8 text-xs"
        >
          {mutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin mr-1" />
          ) : null}
          Generate
        </Button>
      </div>

      {mutation.isPending && (
        <p className="rounded-md border-2 border-border bg-surface-muted px-3 py-2 text-xs font-bold text-muted-foreground">Generating summary...</p>
      )}

      {error && (
        <p className="rounded-md border-2 border-border bg-danger-soft px-3 py-2 text-xs font-bold text-foreground">{error}</p>
      )}

      {result && !mutation.isPending && (
        <div className="max-h-[400px] overflow-auto rounded-md border-2 border-border bg-surface p-3 text-xs font-medium leading-relaxed whitespace-pre-wrap shadow-neoSm">
          {result}
        </div>
      )}

      {!result && !mutation.isPending && !error && (
        <p className="neo-empty p-4 text-center text-xs font-bold text-muted-foreground">
          Choose a length and generate a summary of this document.
        </p>
      )}
    </div>
  );
}
