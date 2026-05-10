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
    return <p className="text-xs text-muted-foreground p-4">Loading highlights...</p>;
  }

  if (highlights.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-1 p-4">
        <GripHorizontal className="h-6 w-6 opacity-30" />
        <p className="text-xs">No highlights yet</p>
        <p className="text-xs">Select text in the document to create one.</p>
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
            className="border rounded-md bg-card overflow-hidden"
          >
            <div className="flex items-start gap-2 p-2">
              <div
                className={cn("h-4 w-4 rounded-full shrink-0 mt-0.5 border", color.bg)}
              />

              <div className="flex-1 min-w-0">
                <p className="text-xs leading-relaxed line-clamp-3">
                  {highlight.text}
                </p>
                {highlight.page != null && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Page {highlight.page}
                  </p>
                )}

                {editingNote === highlight.id ? (
                  <div className="mt-1.5 flex gap-1">
                    <input
                      autoFocus
                      className="flex-1 text-xs border rounded px-1.5 py-0.5 bg-background"
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
                      className="p-0.5 rounded hover:bg-accent"
                      onClick={() => handleSaveNote(highlight)}
                    >
                      <Check className="h-3 w-3 text-green-600" />
                    </button>
                    <button
                      className="p-0.5 rounded hover:bg-accent"
                      onClick={() => {
                        setEditingNote(null);
                        setNoteText("");
                      }}
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

            <div className="flex items-center justify-between px-2 py-1 border-t bg-muted/30">
              <div className="flex items-center gap-0.5">
                {colorOptions.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => handleChangeColor(highlight, c.value)}
                    className={cn(
                      "h-3 w-3 rounded-full border transition-all",
                      c.bg,
                      highlight.color === c.value && "ring-1 ring-offset-1"
                    )}
                    title={c.value}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                {!editingNote || editingNote !== highlight.id ? (
                  <button
                    className="p-1 rounded hover:bg-accent"
                    onClick={() => {
                      setEditingNote(highlight.id);
                      setNoteText(highlight.note || "");
                    }}
                    title="Edit note"
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                ) : null}
                {onJumpToHighlight && (
                  <button
                    className="p-1 rounded hover:bg-accent"
                    onClick={() => onJumpToHighlight(highlight)}
                    title="Jump to highlight"
                  >
                    <GripHorizontal className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
                <button
                  className="p-1 rounded hover:bg-accent"
                  onClick={() => handleDelete(highlight)}
                  title="Delete highlight"
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
