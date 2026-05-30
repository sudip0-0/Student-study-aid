import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import MDEditor from "@uiw/react-md-editor";
import { Button } from "../ui/button";
import { useCreateNote, useUpdateNote, useDeleteNote } from "../../hooks";
import type { Note } from "../../types";
import "@uiw/react-md-editor/markdown-editor.css";

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
    <div className="flex h-full flex-col" data-color-mode="light">
      <div className="mb-2 flex shrink-0 items-center justify-between">
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

      <div className="min-h-[220px] flex-1 overflow-hidden rounded-neoLg border-2 border-border shadow-neoSm">
        <MDEditor
          value={content}
          onChange={(value) => setContent(value || "")}
          preview="edit"
          height={220}
          textareaProps={{ placeholder: "Write notes in Markdown…" }}
        />
      </div>

      {createNote.isError && (
        <p className="mt-1 text-xs text-destructive">
          {(createNote.error as Error)?.message || "Failed to create note."}
        </p>
      )}
      {updateNote.isError && (
        <p className="mt-1 text-xs text-destructive">
          {(updateNote.error as Error)?.message || "Failed to update note."}
        </p>
      )}
      {deleteNote.isError && (
        <p className="mt-1 text-xs text-destructive">
          {(deleteNote.error as Error)?.message || "Failed to delete note."}
        </p>
      )}

      <div className="mt-2 flex shrink-0 items-center justify-end gap-2">
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
