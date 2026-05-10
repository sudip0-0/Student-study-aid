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
    return <p className="text-xs text-muted-foreground p-4">Loading notes...</p>;
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
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 p-4">
        <StickyNote className="h-8 w-8 opacity-30" />
        <p className="text-xs">No notes yet for this document.</p>
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
        <p className="text-xs text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3 w-3 mr-1" />
          New
        </Button>
      </div>

      <div className="flex-1 overflow-auto space-y-2">
        {notes.map((note) => (
          <div
            key={note.id}
            className="border rounded-md p-3 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedNote(note)}
          >
            <p className="text-xs line-clamp-3 whitespace-pre-wrap">
              {note.content}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {new Date(note.updatedAt || note.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
