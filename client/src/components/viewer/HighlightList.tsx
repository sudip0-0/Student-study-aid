import { useState } from "react";
import { Trash2, GripHorizontal, Pencil, Check, X } from "lucide-react";
import { useHighlights, useUpdateHighlight, useDeleteHighlight } from "../../hooks";
import type { Highlight } from "../../types";
import { cn } from "../../lib/utils";

interface HighlightListProps {
  fileId: string;
  onJumpToHighlight?: (highlight: Highlight) => void;
}

const colorOptions = [
  { value: "yellow" as const, bg: "bg-yellow-300", ring: "ring-yellow-400" },
  { value: "green" as const, bg: "bg-green-300", ring: "ring-green-400" },
  { value: "pink" as const, bg: "bg-pink-300", ring: "ring-pink-400" },
  { value: "blue" as const, bg: "bg-blue-300", ring: "ring-blue-400" },
];

const colorClasses: Record<string, { bg: string; ring: string }> = {
  yellow: { bg: "bg-yellow-300", ring: "ring-yellow-400" },
  green: { bg: "bg-green-300", ring: "ring-green-400" },
  pink: { bg: "bg-pink-300", ring: "ring-pink-400" },
  blue: { bg: "bg-blue-300", ring: "ring-blue-400" },
};

export default function HighlightList({ fileId, onJumpToHighlight }: HighlightListProps) {
  const { data: highlights = [], isLoading } = useHighlights(fileId);
  const updateHighlight = useUpdateHighlight();
  const deleteHighlight = useDeleteHighlight();

  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const handleSaveNote = (highlight: Highlight) => {
    updateHighlight.mutate({ id: highlight.id, fileId, note: noteText });
    setEditingNote(null);
    setNoteText("");
  };

  const handleChangeColor = (highlight: Highlight, color: string) => {
    updateHighlight.mutate({ id: highlight.id, fileId, color });
  };

  const handleDelete = (highlight: Highlight) => {
    deleteHighlight.mutate({ id: highlight.id, fileId });
  };

  if (isLoading) {
    return <p className="neo-box p-4 text-xs font-bold text-muted-foreground">Loading highlights...</p>;
  }

  if (highlights.length === 0) {
    return (
      <div className="neo-empty flex h-full flex-col items-center justify-center gap-1 p-4 text-center text-muted-foreground">
        <div className="mb-2 grid h-12 w-12 place-items-center rounded-md border-2 border-border bg-accent shadow-neoSm">
          <GripHorizontal className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-xs font-extrabold text-foreground">No highlights yet</p>
        <p className="text-xs font-bold">Select text in the document to create one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {highlights.map((highlight) => {
        const color = colorClasses[highlight.color] || colorClasses.yellow;

        return (
          <div
            key={highlight.id}
            className="overflow-hidden rounded-md border-2 border-border bg-surface shadow-neoSm"
          >
            <div className="flex items-start gap-2 p-2">
              <div
                className={cn("mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 border-border", color.bg)}
              />

              <div className="flex-1 min-w-0">
                <p className="line-clamp-3 text-xs font-bold leading-relaxed">
                  {highlight.text}
                </p>
                {highlight.page != null && (
                  <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                    Page {highlight.page}
                  </p>
                )}

                {editingNote === highlight.id ? (
                  <div className="mt-1.5 flex gap-1">
                    <input
                      autoFocus
                      className="flex-1 rounded border-2 border-border bg-surface px-1.5 py-0.5 text-xs font-bold"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveNote(highlight);
                        if (e.key === "Escape") {
                          setEditingNote(null);
                          setNoteText("");
                        }
                      }}
                    />
                    <button
                      className="rounded border-2 border-transparent p-0.5 hover:border-border hover:bg-accent"
                      onClick={() => handleSaveNote(highlight)}
                      aria-label="Save highlight note"
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </button>
                    <button
                      className="rounded border-2 border-transparent p-0.5 hover:border-border hover:bg-accent"
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText("");
                      }}
                      aria-label="Cancel highlight note edit"
                    >
                      <X className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ) : highlight.note ? (
                  <p className="text-xs text-muted-foreground mt-1 italic">
                    {highlight.note}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-between border-t-2 border-border bg-surface-muted px-2 py-1">
              <div className="flex items-center gap-0.5">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleChangeColor(highlight, c.value)}
                    className={cn(
                      "h-4 w-4 rounded-full border-2 border-border transition-all",
                      c.bg,
                      highlight.color === c.value && "ring-1 ring-offset-1"
                    )}
                    title={c.value}
                    aria-label={`Set highlight color to ${c.value}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                {!editingNote || editingNote !== highlight.id ? (
                  <button
                    className="rounded border-2 border-transparent p-1 hover:border-border hover:bg-accent"
                    onClick={() => {
                      setEditingNote(highlight.id);
                      setNoteText(highlight.note || "");
                    }}
                    title="Edit note"
                    aria-label="Edit highlight note"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                ) : null}
                {onJumpToHighlight && (
                  <button
                    className="rounded border-2 border-transparent p-1 hover:border-border hover:bg-accent"
                    onClick={() => onJumpToHighlight(highlight)}
                    title="Jump to highlight"
                    aria-label="Jump to highlight"
                  >
                    <GripHorizontal className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <button
                  className="rounded border-2 border-transparent p-1 hover:border-border hover:bg-accent"
                  onClick={() => handleDelete(highlight)}
                  title="Delete highlight"
                  aria-label="Delete highlight"
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
