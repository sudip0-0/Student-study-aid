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
  pdf: "text-danger",
  docx: "text-secondary",
  txt: "text-success",
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
      <div className="overflow-hidden rounded-neoLg border-2 border-border bg-surface shadow-neoSm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-foreground text-surface">
              <th className="px-4 py-2 text-left font-mono text-xs font-extrabold uppercase">Name</th>
              <th className="hidden px-4 py-2 text-left font-mono text-xs font-extrabold uppercase sm:table-cell">Type</th>
              <th className="hidden px-4 py-2 text-left font-mono text-xs font-extrabold uppercase md:table-cell">Size</th>
              <th className="hidden px-4 py-2 text-left font-mono text-xs font-extrabold uppercase lg:table-cell">Date</th>
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
      <div className="neo-empty flex flex-col items-center justify-center p-10 text-center">
        <p className="text-base font-extrabold text-foreground">No files in this folder</p>
        <p className="mt-1 text-sm text-muted-foreground">Upload a file to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-neoLg border-2 border-border bg-surface shadow-neoSm">
      <div className="divide-y-2 divide-border sm:hidden">
        {files.map((file) => {
          const Icon = typeIcons[file.type] || File;
          const menuOpen = openMenu === file.id;
          return (
            <div key={file.id} className="p-3">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => navigate(`/study/${file.id}`)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border-2 border-border bg-accent-soft shadow-neoSm">
                    <Icon className={cn("h-5 w-5", typeColors[file.type] || "text-muted-foreground")} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold">{file.name}</span>
                    <span className="mt-1 block font-mono text-[11px] font-bold uppercase text-muted-foreground">
                      {file.type} - {formatSize(file.size)}
                    </span>
                  </span>
                </button>
                <button
                  onClick={() => setOpenMenu(menuOpen ? null : file.id)}
                  className="rounded-md border-2 border-border bg-surface p-2 shadow-neoSm hover:bg-accent"
                  aria-label={`Open actions for ${file.name}`}
                  aria-expanded={menuOpen}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              {menuOpen && (
                <div className="mt-3 grid gap-2 rounded-md border-2 border-border bg-surface-muted p-2">
                  <button
                    className="flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-bold hover:bg-accent"
                    onClick={() => {
                      setOpenMenu(null);
                      onRename(file);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Rename
                  </button>
                  {folders.filter((f) => f.id !== folderId).map((f) => (
                    <button
                      key={f.id}
                      className="flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-bold hover:bg-accent"
                      onClick={() => {
                        updateFile.mutate({ id: file.id, folderId: f.id });
                        setOpenMenu(null);
                      }}
                    >
                      <FolderInput className="h-3.5 w-3.5" /> {f.name}
                    </button>
                  ))}
                  {file.folderId && (
                    <button
                      className="flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-bold text-muted-foreground hover:bg-accent"
                      onClick={() => {
                        updateFile.mutate({ id: file.id, folderId: null });
                        setOpenMenu(null);
                      }}
                    >
                      <FolderInput className="h-3.5 w-3.5" /> Move to root
                    </button>
                  )}
                  <button
                    className="flex min-h-10 items-center gap-2 rounded-md px-3 text-left text-sm font-bold text-destructive hover:bg-danger-soft"
                    onClick={() => {
                      setOpenMenu(null);
                      if (confirm("Delete this file?")) deleteFile.mutate(file.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <table className="hidden w-full text-sm sm:table">
        <thead>
          <tr className="border-b-2 border-border bg-foreground text-surface">
            <th className="px-4 py-2 text-left font-mono text-xs font-extrabold uppercase">Name</th>
            <th className="hidden px-4 py-2 text-left font-mono text-xs font-extrabold uppercase sm:table-cell">Type</th>
            <th className="hidden px-4 py-2 text-left font-mono text-xs font-extrabold uppercase md:table-cell">Size</th>
            <th className="hidden px-4 py-2 text-left font-mono text-xs font-extrabold uppercase lg:table-cell">Date</th>
            <th className="w-10 px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const Icon = typeIcons[file.type] || File;
            return (
              <tr key={file.id} className="border-b-2 border-border transition-colors hover:bg-accent-soft">
                <td className="px-4 py-3">
                  <button
                    onClick={() => navigate(`/study/${file.id}`)}
                    className="flex items-center gap-2 font-bold transition-colors hover:text-primary"
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", typeColors[file.type] || "text-muted-foreground")} />
                    <span className="font-medium truncate max-w-[200px]">{file.name}</span>
                  </button>
                </td>
                <td className="hidden px-4 py-3 font-mono text-xs uppercase text-muted-foreground sm:table-cell">{file.type}</td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground md:table-cell">{formatSize(file.size)}</td>
                <td className="hidden px-4 py-3 font-mono text-xs text-muted-foreground lg:table-cell">
                  {new Date(file.createdAt).toLocaleDateString()}
                </td>
                <td className="px-2 py-3 relative">
                  <button
                    onClick={() => setOpenMenu(openMenu === file.id ? null : file.id)}
                    className="rounded-md border-2 border-transparent p-1 hover:border-border hover:bg-accent"
                    aria-label={`Open actions for ${file.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {openMenu === file.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border-2 border-border bg-surface py-1 shadow-neoMd" onClick={() => setOpenMenu(null)}>
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-accent"
                        onClick={() => onRename(file)}
                      >
                        <Pencil className="h-3.5 w-3.5" /> Rename
                      </button>
                      {folders.length > 0 && (
                        <div className="relative group">
                          <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-accent">
                            <FolderInput className="h-3.5 w-3.5" /> Move to
                          </button>
                          <div className="absolute left-full top-0 ml-1 hidden w-36 rounded-md border-2 border-border bg-surface py-1 shadow-neoMd group-hover:block">
                            {folders.filter(f => f.id !== folderId).map((f) => (
                              <button
                                key={f.id}
                                className="w-full truncate px-3 py-2 text-left text-sm font-bold hover:bg-accent"
                                onClick={() => updateFile.mutate({ id: file.id, folderId: f.id })}
                              >
                                {f.name}
                              </button>
                            ))}
                            {file.folderId && (
                              <button
                                className="w-full px-3 py-2 text-left text-sm font-bold text-muted-foreground hover:bg-accent"
                                onClick={() => updateFile.mutate({ id: file.id, folderId: null })}
                              >
                                Root
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <button
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-destructive hover:bg-danger-soft"
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
