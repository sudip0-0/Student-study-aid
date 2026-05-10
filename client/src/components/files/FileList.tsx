import { useNavigate } from "react-router-dom";
import { FileText, File, MoreVertical, Pencil, Trash2, FolderInput } from "lucide-react";
import type { File as FileType } from "../../types";
import { useDeleteFile, useUpdateFile, useFolders } from "../../hooks";
import { Skeleton } from "../shared/Skeleton";
import { cn } from "../../lib/utils";
import { useState } from "react";

interface FileListProps {
  files: FileType[];
  isLoading: boolean;
  folderId: string | null;
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

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList({ files, isLoading, folderId, onRename }: FileListProps) {
  const navigate = useNavigate();
  const { data: folders = [] } = useFolders();
  const deleteFile = useDeleteFile();
  const updateFile = useUpdateFile();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Size</th>
              <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-12" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-4 w-16" /></td>
                <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                <td className="px-2 py-3" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
        <p className="text-sm">No files in this folder</p>
        <p className="text-xs mt-1">Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">Type</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Size</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">Date</th>
            <th className="w-10 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const Icon = typeIcons[file.type] || File;
            return (
              <tr key={file.id} className="border-b hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/study/${file.id}`)}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", typeColors[file.type] || "text-muted-foreground")} />
                    <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground uppercase hidden sm:table-cell">{file.type}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{formatSize(file.size)}</td>
                <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                  {new Date(file.createdAt).toLocaleDateString()}
                </td>
                <td className="px-2 py-3 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === file.id ? null : file.id)}
                    className="p-1 rounded-md hover:bg-accent"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === file.id && (
                    <div className="absolute right-0 top-full mt-1 z-10 bg-card border rounded-md shadow-lg py-1 w-40" onClick={() => setOpenMenu(null)}>
                      <button
                        className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent"
                        onClick={() => onRename(file)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </button>
                      {folders.length > 0 && (
                        <div className="relative group">
                          <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent">
                            <FolderInput className="h-3.5 w-3.5" /> Move to
                          </button>
                          <div className="absolute left-full top-0 ml-1 bg-card border rounded-md shadow-lg py-1 w-36 hidden group-hover:block">
                            {folders.filter(f => f.id !== folderId).map((f) => (
                              <button
                                key={f.id}
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent truncate"
                                onClick={() => updateFile.mutate({ id: file.id, folderId: f.id })}
                              >
                                {f.name}
                              </button>
                            ))}
                            {file.folderId && (
                              <button
                                className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent text-muted-foreground"
                                onClick={() => updateFile.mutate({ id: file.id, folderId: null })}
                              >
                                Root
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent text-destructive"
                        onClick={() => { if (confirm("Delete this file?")) deleteFile.mutate(file.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
