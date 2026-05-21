import { useState } from "react";
import { Plus, StickyNote } from "lucide-react";
import { useNotes } from "../../hooks";
import { Button } from "../ui/button";
import NoteEditor from "./NoteEditor";
import type { Note } from "../../types";

interface NoteListProps {
  fileId: string;
}

export default function NoteList({ fileId }: NoteListProps) {
  const { data: notes = [], isLoading } = useNotes(fileId);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) {
    return <p className="neo-box p-4 text-xs font-bold text-muted-foreground">Loading notes...</p>;
  }

  if (selectedNote) {
    return (
      <NoteEditor
        fileId={fileId}
        note={selectedNote}
        onCancel={() => setSelectedNote(null)}
      />
    );
  }

  if (showCreate) {
    return (
      <NoteEditor
        fileId={fileId}
        onCancel={() => setShowCreate(false)}
      />
    );
  }

  if (notes.length === 0) {
    return (
      <div className="neo-empty flex h-full flex-col items-center justify-center gap-3 p-4 text-center text-muted-foreground">
        <div className="grid h-12 w-12 place-items-center rounded-md border-2 border-border bg-accent shadow-neoSm">
          <StickyNote className="h-6 w-6 text-foreground" />
        </div>
        <p className="text-xs font-bold">No notes yet for this document.</p>
        <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create Note
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <p className="font-mono text-xs font-bold text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {notes.map((note) => (
          <button
            key={note.id}
            className="w-full rounded-md border-2 border-border bg-surface p-3 text-left shadow-neoSm transition-colors hover:bg-accent-soft"
            onClick={() => setSelectedNote(note)}
          >
            <p className="line-clamp-3 whitespace-pre-wrap text-xs font-bold">
              {note.content}
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
