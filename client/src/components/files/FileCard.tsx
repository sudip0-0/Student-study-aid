import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  pdf: "bg-danger-soft text-danger",
  docx: "bg-secondary-soft text-secondary",
  txt: "bg-success-soft text-success",
};

export default function FileCard({ file, onSelect, onRename }: FileCardProps) {
  const Icon = typeIcons[file.type] || File;
  const deleteFile = useDeleteFile();
  const updateFile = useUpdateFile();
  const { data: folders = [] } = useFolders();
  const [showMenu, setShowMenu] = useState(false);
  const [showMove, setShowMove] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = 176;
    const margin = 12;
    setMenuPosition({
      top: Math.min(rect.bottom + 8, window.innerHeight - margin),
      left: Math.min(Math.max(rect.right - menuWidth, margin), window.innerWidth - menuWidth - margin),
    });
  };

  useEffect(() => {
    if (!showMenu) return;

    updateMenuPosition();

    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setShowMenu(false);
        setShowMove(false);
      }
    };
    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener("mousedown", handler);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [showMenu]);

  return (
    <div
      className="relative group"
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/file-id", file.id);
        e.dataTransfer.effectAllowed = "move";
      }}
    >
      <button
        onClick={() => onSelect(file)}
        className={cn(
          "neo-hover flex w-full flex-col items-center gap-3 rounded-neoLg border-2 border-border bg-surface p-4 text-center shadow-neoSm"
        )}
      >
        <span className={cn("grid h-12 w-12 place-items-center rounded-md border-2 border-border shadow-neoSm", typeColors[file.type] || "bg-surface-muted text-muted-foreground")}>
          <Icon className="h-6 w-6" />
        </span>
        <span className="max-w-full truncate text-sm font-extrabold">{file.name}</span>
        <span className="rounded-full border-2 border-border bg-accent-soft px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase">{file.type}</span>
      </button>

      <button
        ref={triggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu((open) => {
            const next = !open;
            if (next) {
              requestAnimationFrame(updateMenuPosition);
            } else {
              setShowMove(false);
            }
            return next;
          });
        }}
        className="absolute right-2 top-2 rounded-md border-2 border-border bg-surface p-1 opacity-100 shadow-neoSm transition-all hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100"
        aria-label={`Open actions for ${file.name}`}
        aria-expanded={showMenu}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {showMenu && menuPosition && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-44 rounded-md border-2 border-border bg-surface py-1 shadow-neoMd"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-accent"
            onClick={() => { setShowMenu(false); onRename(file); }}
          >
            <Pencil className="h-3.5 w-3.5" /> Rename
          </button>
          {folders.length > 0 && (
            <div>
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-accent"
                onClick={() => setShowMove(!showMove)}
                aria-expanded={showMove}
              >
                <FolderInput className="h-3.5 w-3.5" /> Move to
              </button>
              {showMove && (
                <div className="mx-2 mb-1 max-h-44 overflow-auto rounded-md border-2 border-border bg-surface-muted py-1">
                  {folders.filter(f => f.id !== file.folderId).map((f) => (
                    <button
                      key={f.id}
                      className="w-full truncate px-2 py-1.5 text-left text-xs font-bold hover:bg-accent"
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
                      className="w-full px-2 py-1.5 text-left text-xs font-bold text-muted-foreground hover:bg-accent"
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
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-destructive hover:bg-danger-soft"
            onClick={() => {
              setShowMenu(false);
              if (confirm("Delete this file?")) deleteFile.mutate(file.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
        , document.body
      )}
    </div>
  );
}
