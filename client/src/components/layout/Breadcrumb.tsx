import { ChevronRight, Folder } from "lucide-react";
import type { Folder as FolderType } from "../../types";
import { cn } from "../../lib/utils";

interface BreadcrumbProps {
  activeFolderId: string | null;
  folders: FolderType[];
  onNavigate: (folderId: string | null) => void;
}

export default function Breadcrumb({ activeFolderId, folders, onNavigate }: BreadcrumbProps) {
  if (!activeFolderId) {
    return (
      <div className="flex min-h-10 items-center gap-1.5 rounded-full border-2 border-border bg-surface px-3 text-sm font-extrabold text-muted-foreground shadow-neoSm">
        <Folder className="h-3.5 w-3.5" />
        <span>All Files</span>
      </div>
    );
  }

  const folderMap = new Map<string, FolderType>();
  for (const f of folders) {
    folderMap.set(f.id, f);
  }

  const path: FolderType[] = [];
  let current = folderMap.get(activeFolderId);
  while (current) {
    path.unshift(current);
    current = current.parentId ? folderMap.get(current.parentId) : undefined;
  }

  return (
    <div className="flex min-h-10 items-center gap-1 overflow-x-auto rounded-full border-2 border-border bg-surface px-3 text-sm font-bold shadow-neoSm">
      <button
        onClick={() => onNavigate(null)}
        className={cn(
          "flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        )}
      >
        <Folder className="h-3.5 w-3.5" />
        <span>All Files</span>
      </button>
      {path.map((folder) => (
        <div key={folder.id} className="flex items-center gap-1">
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          {folder.id === activeFolderId ? (
            <span className="font-medium text-foreground">{folder.name}</span>
          ) : (
            <button
              onClick={() => onNavigate(folder.id)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {folder.name}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
