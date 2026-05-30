import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, Copy, RotateCcw } from "lucide-react";
import { getApiErrorMessage } from "../../lib/api";
import { toast } from "sonner";
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
          setError(getApiErrorMessage(err, "Failed to generate summary"));
        },
      }
    );
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Summary copied");
    } catch {
      toast.error("Could not copy summary");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="summary-length" className="sr-only">
          Summary length
        </label>
        <select
          id="summary-length"
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
        <div className="space-y-2">
          <p className="rounded-md border-2 border-border bg-danger-soft px-3 py-2 text-xs font-bold text-foreground">{error}</p>
          <Button size="sm" variant="outline" onClick={handleGenerate} disabled={mutation.isPending} className="h-8 text-xs">
            <RotateCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {result && !mutation.isPending && (
        <div className="space-y-2">
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={handleCopy} className="h-8 text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          <div className="max-h-[400px] overflow-auto rounded-md border-2 border-border bg-surface p-3 text-xs font-medium leading-relaxed whitespace-pre-wrap shadow-neoSm">
            {result}
          </div>
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
