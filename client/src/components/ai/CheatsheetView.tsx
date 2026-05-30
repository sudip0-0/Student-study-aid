import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, ChevronLeft, X } from "lucide-react";
import { useCheatsheets, useDeleteCheatsheet } from "../../hooks";
import { getApiErrorMessage } from "../../lib/api";
import AIErrorRetry from "./AIErrorRetry";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Cheatsheet, CheatsheetSection } from "../../types";

interface CheatsheetViewProps {
  fileId: string;
  mutation: UseMutationResult<Cheatsheet, Error, { fileId: string }>;
}

export default function CheatsheetView({ fileId, mutation }: CheatsheetViewProps) {
  const { data: saved = [] } = useCheatsheets(fileId);
  const deleteCheatsheet = useDeleteCheatsheet();
  const [active, setActive] = useState<Cheatsheet | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    mutation.mutate(
      { fileId },
      {
        onSuccess: (data) => setActive(data),
        onError: (err: Error) => {
          setError(getApiErrorMessage(err, "Failed to generate cheatsheet"));
        },
      }
    );
  };

  // Active cheatsheet view
  if (active) {
    const sections = active.sections as CheatsheetSection[];
    return (
      <div className="space-y-3">
        <button onClick={() => setActive(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-3 w-3" /> Back
        </button>
        <p className="rounded-md border-2 border-border bg-accent-soft px-3 py-2 text-xs font-extrabold">{active.title}</p>
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {sections.map((section, i) => (
            <div key={i} className="rounded-md border-2 border-border bg-surface p-3 shadow-neoSm">
              <h4 className="mb-1.5 text-xs font-extrabold text-primary">{section.title}</h4>
              <ul className="space-y-1">
                {section.points.map((point, j) => (
                  <li key={j} className="flex gap-1.5 text-xs font-bold text-muted-foreground">
                    <span className="text-primary shrink-0">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-3">
      <Button size="sm" variant="outline" onClick={handleGenerate} disabled={mutation.isPending} className="h-8 text-xs">
        {mutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
        Generate Cheatsheet
      </Button>

      {mutation.isPending && <p className="rounded-md border-2 border-border bg-surface-muted px-3 py-2 text-xs font-bold text-muted-foreground">Generating cheatsheet...</p>}
      {error && (
        <AIErrorRetry message={error} onRetry={handleGenerate} disabled={mutation.isPending} />
      )}

      {saved.length > 0 && (
        <div className="space-y-1.5">
          <p className="font-mono text-xs font-bold text-muted-foreground">Saved Cheatsheets</p>
          {saved.map((cs) => (
            <div
              key={cs.id}
              className="flex cursor-pointer items-center justify-between rounded-md border-2 border-border bg-surface px-2.5 py-2 shadow-neoSm hover:bg-accent-soft"
              onClick={() => setActive(cs)}
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{cs.title}</p>
                <p className="text-[11px] text-muted-foreground">{(cs.sections as CheatsheetSection[]).length} sections</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this cheatsheet?")) deleteCheatsheet.mutate(cs.id); }}
                className="shrink-0 p-1 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${cs.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {saved.length === 0 && !mutation.isPending && !error && (
        <p className="neo-empty p-4 text-center text-xs font-bold text-muted-foreground">Generate a structured cheatsheet organized by topic.</p>
      )}
    </div>
  );
}
