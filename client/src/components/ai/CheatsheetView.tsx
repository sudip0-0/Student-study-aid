import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2, ChevronLeft, X } from "lucide-react";
import { useCheatsheets, useDeleteCheatsheet } from "../../hooks";
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
          const msg = (err as unknown as { response?: { data?: { error?: string } } }).response?.data?.error || err.message;
          setError(msg);
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
        <p className="text-xs font-medium">{active.title}</p>
        <div className="space-y-4 max-h-[400px] overflow-auto">
          {sections.map((section, i) => (
            <div key={i}>
              <h4 className="text-xs font-semibold mb-1.5 text-primary">{section.title}</h4>
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

      {mutation.isPending && <p className="text-xs text-muted-foreground">Generating cheatsheet...</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {saved.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Saved Cheatsheets</p>
          {saved.map((cs) => (
            <div
              key={cs.id}
              className="flex items-center justify-between border rounded-md px-2.5 py-2 hover:bg-muted/50 cursor-pointer"
              onClick={() => setActive(cs)}
            >
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{cs.title}</p>
                <p className="text-[11px] text-muted-foreground">{(cs.sections as CheatsheetSection[]).length} sections</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); if (confirm("Delete this cheatsheet?")) deleteCheatsheet.mutate(cs.id); }}
                className="text-muted-foreground hover:text-destructive p-1 shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {saved.length === 0 && !mutation.isPending && !error && (
        <p className="text-xs text-muted-foreground">Generate a structured cheatsheet organized by topic.</p>
      )}
    </div>
  );
}
