import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { useCreateNote, useUpdateNote, useDeleteNote } from "../../hooks";
import type { Note } from "../../types";

interface NoteEditorProps {
  fileId: string;
  note?: Note | null;
  onCancel?: () => void;
}

export default function NoteEditor({ fileId, note, onCancel }: NoteEditorProps) {
  const [content, setContent] = useState(note?.content || "");
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  useEffect(() => {
    setContent(note?.content || "");
  }, [note]);

  const isEditing = !!note;
  const isPending = createNote.isPending || updateNote.isPending;

  const handleSave = async () => {
    if (!content.trim()) return;
    if (isEditing) {
      await updateNote.mutateAsync({ id: note.id, fileId, content: content.trim() });
    } else {
      await createNote.mutateAsync({ fileId, content: content.trim() });
      setContent("");
      onCancel?.();
    }
  };

  const handleDelete = async () => {
    if (!note) return;
    await deleteNote.mutateAsync({ id: note.id, fileId });
    onCancel?.();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <p className="font-mono text-xs font-bold text-muted-foreground">
          {isEditing ? "Edit note" : "New note"}
        </p>
        <div className="flex items-center gap-1">
          {isEditing && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
              aria-label="Delete note"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </Button>
          )}
        </div>
      </div>

      <textarea
        className="min-h-[200px] w-full flex-1 resize-none rounded-neoLg border-2 border-border bg-surface px-3 py-2 text-sm font-medium shadow-neoSm focus:outline-none"
        placeholder="Write your notes here... (markdown supported)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      {createNote.isError && (
        <p className="text-xs text-destructive mt-1">{(createNote.error as Error)?.message || "Failed to create note."}</p>
      )}
      {updateNote.isError && (
        <p className="text-xs text-destructive mt-1">{(updateNote.error as Error)?.message || "Failed to update note."}</p>
      )}
      {deleteNote.isError && (
        <p className="text-xs text-destructive mt-1">{(deleteNote.error as Error)?.message || "Failed to delete note."}</p>
      )}

      <div className="flex items-center justify-end gap-2 mt-2 shrink-0">
        {onCancel && (
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button size="sm" onClick={handleSave} disabled={isPending || !content.trim()}>
          {isPending ? "Saving..." : isEditing ? "Save" : "Create Note"}
        </Button>
      </div>
    </div>
  );
}
