import { useState } from "react";
import { FileText, File, MoreVertical, Pencil, Trash2, FolderInput } from "lucide-react";
import type { File as FileType } from "../../types";
import { cn } from "../../lib/utils";
import { useDeleteFile, useUpdateFile, useFolders } from "../../hooks";

interface FileCardProps {
  file: FileType;
  onSelect: (file: FileType) => void;
  onRename: (file: FileType) => void;
}

const typeIcons: Record<string, typeof FileText> = {
  pdf: FileText,
  docx: FileText,
  txt: File,
};

const typeColors: Record<string, string> = {
  pdf: "text-red-500",
  docx: "text-blue-500",
  txt: "text-green-500",
};

export default function FileCard({ file, onSelect, onRename }: FileCardProps) {
  const Icon = typeIcons[file.type] || File;
  const deleteFile = useDeleteFile();
  const updateFile = useUpdateFile();
  const { data: folders = [] } = useFolders();
  const [showMenu, setShowMenu] = useState(false);
  const [showMove, setShowMove] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(file)}
        className={cn(
          "flex flex-col items-center gap-2 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-center w-full"
        )}
      >
        <Icon className={cn("h-8 w-8", typeColors[file.type] || "text-muted-foreground")} />
        <span className="text-sm font-medium truncate max-w-full">{file.name}</span>
        <span className="text-xs text-muted-foreground uppercase">{file.type}</span>
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
        className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {showMenu && (
        <div
          className="absolute right-2 top-10 z-10 bg-card border rounded-md shadow-lg py-1 w-36"
          onClick={() => setShowMenu(false)}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent"
            onClick={() => onRename(file)}
          >
            <Pencil className="h-3.5 w-3.5" /> Rename
          </button>
          {folders.length > 0 && (
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent"
                onClick={() => setShowMove(!showMove)}
              >
                <FolderInput className="h-3.5 w-3.5" /> Move to
              </button>
              {showMove && (
                <div className="absolute left-full top-0 ml-1 bg-card border rounded-md shadow-lg py-1 w-32">
                  {folders.filter(f => f.id !== file.folderId).map((f) => (
                    <button
                      key={f.id}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent truncate"
                      onClick={() => {
                        updateFile.mutate({ id: file.id, folderId: f.id });
                        setShowMove(false);
                        setShowMenu(false);
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                  {file.folderId && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent text-muted-foreground"
                      onClick={() => {
                        updateFile.mutate({ id: file.id, folderId: null });
                        setShowMove(false);
                        setShowMenu(false);
                      }}
                    >
                      Root
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent text-destructive"
            onClick={() => {
              if (confirm("Delete this file?")) deleteFile.mutate(file.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
