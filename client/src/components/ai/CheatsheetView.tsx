import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { CheatsheetSection } from "../../types";

interface CheatsheetViewProps {
  fileId: string;
  mutation: UseMutationResult<CheatsheetSection[], Error, { fileId: string }>;
}

export default function CheatsheetView({ fileId, mutation }: CheatsheetViewProps) {
  const [sections, setSections] = useState<CheatsheetSection[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    mutation.mutate(
      { fileId },
      {
        onSuccess: (data) => setSections(data),
        onError: (err: Error) => {
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
        },
      }
    );
  };

  return (
    <div className="space-y-3">
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
        Generate Cheatsheet
      </Button>

      {mutation.isPending && (
        <p className="text-xs text-muted-foreground">Generating cheatsheet...</p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {sections && (
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {sections.map((section, i) => (
            <div key={i}>
              <h4 className="text-xs font-semibold mb-1.5 text-primary">
                {section.title}
              </h4>
              <ul className="space-y-1">
                {section.points.map((point, j) => (
                  <li key={j} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!sections && !mutation.isPending && !error && (
        <p className="text-xs text-muted-foreground">
          Generate a structured cheatsheet organized by topic.
        </p>
      )}
    </div>
  );
}
