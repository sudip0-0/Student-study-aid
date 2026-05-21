import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Folder,
  ChevronRight,
  ChevronDown,
  FilePlus,
  FolderPlus,
  FileText,
  FileType2,
  Pencil,
  Trash2,
  NotebookPen,
} from "lucide-react";
import { useFolders, useAllFiles, useCreateFolder, useDeleteFolder, useUpdateFolder, useCreateBlankFile, useUpdateFile, useDeleteFile } from "../../hooks";
import type { Folder as FolderType, File as FileType } from "../../types";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface FolderTreeProps {
  activeFolderId: string | null;
  onSelect: (folderId: string | null) => void;
  onUploadToFolder: (folderId: string | null) => void;
}

function FileIcon({ type }: { type: string }) {
  if (type === "pdf") return <FileType2 className="h-3.5 w-3.5 shrink-0 text-red-500" />;
  if (type === "docx") return <FileType2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />;
  return <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
}

interface ContextMenuState {
  x: number;
  y: number;
  folderId: string;
}

interface FileContextMenuState {
  x: number;
  y: number;
  fileId: string;
  fileName: string;
}

function FolderNode({
  folder,
  childFolders,
  childMap,
  fileMap,
  activeId,
  onSelect,
  onUpload,
  onContextMenu,
  onFileDrop,
  onFileRename,
  onFileContextMenu,
  renamingFileId,
  renameValue,
  setRenameValue,
  onRenameSubmit,
  onRenameCancel,
  level,
}: {
  folder: FolderType;
  childFolders: FolderType[];
  childMap: Map<string, FolderType[]>;
  fileMap: Map<string | null, FileType[]>;
  activeId: string | null;
  onSelect: (id: string) => void;
  onUpload: (folderId: string) => void;
  onContextMenu: (e: React.MouseEvent, folderId: string) => void;
  onFileDrop: (fileId: string, folderId: string | null) => void;
  onFileRename: (fileId: string, name: string) => void;
  onFileContextMenu: (e: React.MouseEvent, fileId: string, fileName: string) => void;
  renamingFileId: string | null;
  renameValue: string;
  setRenameValue: (v: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  level: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const hasChildren = childFolders.length > 0;
  const folderFiles = fileMap.get(folder.id) || [];
  const hasContent = hasChildren || folderFiles.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center hover:bg-accent rounded-md",
          dragOver && "ring-2 ring-primary bg-primary/10"
        )}
        onContextMenu={(e) => onContextMenu(e, folder.id)}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          const fileId = e.dataTransfer.getData("text/file-id");
          if (fileId) onFileDrop(fileId, folder.id);
        }}
      >
        <button
          onClick={() => {
            onSelect(folder.id);
            if (hasContent) setExpanded(!expanded);
          }}
          className={cn(
            "flex-1 flex items-center gap-1.5 px-2 py-1.5 text-sm transition-colors min-w-0",
            activeId === folder.id && "text-accent-foreground font-medium"
          )}
          style={{ paddingLeft: `${level * 14 + 8}px` }}
        >
          {hasContent ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <span className="w-3.5 shrink-0" />
          )}
          <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: folder.color }} />
          <span className="truncate">{folder.name}</span>
        </button>
        <div className="hidden group-hover:flex items-center pr-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onUpload(folder.id); }}
            className="p-0.5 rounded hover:bg-background"
            title="Upload file here"
            aria-label={`Upload file to ${folder.name}`}
          >
            <FilePlus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onContextMenu(e, folder.id); }}
            className="p-0.5 rounded hover:bg-background"
            title="More actions"
            aria-label={`Open actions for ${folder.name}`}
          >
            <FolderPlus className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      {expanded && (
        <div>
          {childFolders.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              childFolders={childMap.get(child.id) || []}
              childMap={childMap}
              fileMap={fileMap}
              activeId={activeId}
              onSelect={onSelect}
              onUpload={onUpload}
              onContextMenu={onContextMenu}
              onFileDrop={onFileDrop}
              onFileRename={onFileRename}
              onFileContextMenu={onFileContextMenu}
              renamingFileId={renamingFileId}
              renameValue={renameValue}
              setRenameValue={setRenameValue}
              onRenameSubmit={onRenameSubmit}
              onRenameCancel={onRenameCancel}
              level={level + 1}
            />
          ))}
          {folderFiles.map((file) =>
            renamingFileId === file.id ? (
              <div key={file.id} className="px-1" style={{ paddingLeft: `${(level + 1) * 14 + 8}px` }}>
                <Input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRenameSubmit();
                    if (e.key === "Escape") onRenameCancel();
                  }}
                  onBlur={onRenameSubmit}
                  className="h-6 text-xs"
                />
              </div>
            ) : (
              <button
                key={file.id}
                draggable
                onDragStart={(e) => { e.dataTransfer.setData("text/file-id", file.id); }}
                onClick={() => navigate(`/study/${file.id}`)}
                onDoubleClick={(e) => { e.preventDefault(); onFileRename(file.id, file.name); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onFileContextMenu(e, file.id, file.name); }}
                className="w-full flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors cursor-grab active:cursor-grabbing"
                style={{ paddingLeft: `${(level + 1) * 14 + 8}px` }}
                title={file.name}
              >
                <FileIcon type={file.type} />
                <span className="truncate">{file.name}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function FolderTree({ activeFolderId, onSelect, onUploadToFolder }: FolderTreeProps) {
  const { data: folders = [], isLoading } = useFolders();
  const { data: allFiles = [] } = useAllFiles();
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const updateFolder = useUpdateFolder();
  const createBlankFile = useCreateBlankFile();
  const updateFile = useUpdateFile();
  const navigate = useNavigate();

  const [creating, setCreating] = useState<string | null | false>(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [fileRenameName, setFileRenameName] = useState("");
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [fileContextMenu, setFileContextMenu] = useState<FileContextMenuState | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);
  const deleteFile = useDeleteFile();

  const rootFolders = folders.filter((f) => !f.parentId);
  const childMap = new Map<string, FolderType[]>();
  for (const f of folders) {
    if (f.parentId) {
      const list = childMap.get(f.parentId) || [];
      list.push(f);
      childMap.set(f.parentId, list);
    }
  }

  const fileMap = new Map<string | null, FileType[]>();
  for (const f of allFiles) {
    const key = f.folderId ?? null;
    const list = fileMap.get(key) || [];
    list.push(f);
    fileMap.set(key, list);
  }

  const rootFiles = fileMap.get(null) || [];

  useEffect(() => {
    if (!contextMenu && !fileContextMenu) return;
    const handler = () => { setContextMenu(null); setFileContextMenu(null); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [contextMenu, fileContextMenu]);

  const handleFileContextMenu = (e: React.MouseEvent, fileId: string, fileName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    setFileContextMenu({ x: e.clientX, y: e.clientY, fileId, fileName });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const parentId = creating === null ? undefined : (creating as string);
    await createFolder.mutateAsync({ name: newName.trim(), parentId });
    setNewName("");
    setCreating(false);
  };

  const handleFolderRename = async () => {
    if (!renameName.trim() || !renaming) return;
    await updateFolder.mutateAsync({ id: renaming, name: renameName.trim() });
    setRenaming(null);
    setRenameName("");
  };

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, folderId });
  };

  const handleFileDrop = (fileId: string, folderId: string | null) => {
    updateFile.mutate({ id: fileId, folderId });
  };

  const handleFileRenameStart = (fileId: string, name: string) => {
    setRenamingFileId(fileId);
    setFileRenameName(name);
  };

  const handleFileRenameSubmit = () => {
    if (renamingFileId && fileRenameName.trim()) {
      updateFile.mutate({ id: renamingFileId, name: fileRenameName.trim() });
    }
    setRenamingFileId(null);
    setFileRenameName("");
  };

  const handleFileRenameCancel = () => {
    setRenamingFileId(null);
    setFileRenameName("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</span>
        <div className="flex gap-0.5">
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={async () => {
              const file = await createBlankFile.mutateAsync({ name: "Untitled Note", folderId: activeFolderId });
              navigate(`/study/${file.id}`);
            }}
            title="New note"
            aria-label="Create new note"
          >
            <NotebookPen className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUploadToFolder(null)} title="Upload file" aria-label="Upload file">
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreating(null)} title="New folder" aria-label="Create new folder">
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {creating !== false && (
        <div className="px-2 py-1.5 flex gap-1">
          <Input
            autoFocus
            placeholder="Folder name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") { setCreating(false); setNewName(""); }
            }}
            className="h-7 text-xs"
          />
          <Button size="sm" className="h-7 text-xs px-2" onClick={handleCreate} disabled={createFolder.isPending}>
            Add
          </Button>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto py-1 px-1"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const fileId = e.dataTransfer.getData("text/file-id");
          if (fileId) handleFileDrop(fileId, null);
        }}
      >
        <button
          onClick={() => onSelect(null)}
          className={cn(
            "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent",
            activeFolderId === null && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <Folder className="h-3.5 w-3.5 shrink-0" />
          <span>All Files</span>
        </button>

        {isLoading ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">Loading...</p>
        ) : (
          <>
            {rootFolders.map((folder) => (
              <div key={folder.id}>
                {renaming === folder.id ? (
                  <div className="px-2 py-1 flex gap-1">
                    <Input
                      autoFocus
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleFolderRename();
                        if (e.key === "Escape") setRenaming(null);
                      }}
                      onBlur={handleFolderRename}
                      className="h-7 text-xs"
                    />
                  </div>
                ) : (
                  <FolderNode
                    folder={folder}
                    childFolders={childMap.get(folder.id) || []}
                    childMap={childMap}
                    fileMap={fileMap}
                    activeId={activeFolderId}
                    onSelect={onSelect}
                    onUpload={onUploadToFolder}
                    onContextMenu={handleContextMenu}
                    onFileDrop={handleFileDrop}
                    onFileRename={handleFileRenameStart}
                    onFileContextMenu={handleFileContextMenu}
                    renamingFileId={renamingFileId}
                    renameValue={fileRenameName}
                    setRenameValue={setFileRenameName}
                    onRenameSubmit={handleFileRenameSubmit}
                    onRenameCancel={handleFileRenameCancel}
                    level={0}
                  />
                )}
              </div>
            ))}
            {rootFiles.map((file) =>
              renamingFileId === file.id ? (
                <div key={file.id} className="px-1" style={{ paddingLeft: "8px" }}>
                  <Input
                    autoFocus
                    value={fileRenameName}
                    onChange={(e) => setFileRenameName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFileRenameSubmit();
                      if (e.key === "Escape") handleFileRenameCancel();
                    }}
                    onBlur={handleFileRenameSubmit}
                    className="h-6 text-xs"
                  />
                </div>
              ) : (
                <button
                  key={file.id}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/file-id", file.id); }}
                  onClick={() => navigate(`/study/${file.id}`)}
                  onDoubleClick={(e) => { e.preventDefault(); handleFileRenameStart(file.id, file.name); }}
                  onContextMenu={(e) => { e.preventDefault(); handleFileContextMenu(e, file.id, file.name); }}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors cursor-grab active:cursor-grabbing"
                  style={{ paddingLeft: "8px" }}
                  title={file.name}
                >
                  <FileIcon type={file.type} />
                  <span className="truncate">{file.name}</span>
                </button>
              )
            )}
          </>
        )}
      </div>

      {contextMenu && (
        <div
          ref={contextRef}
          className="fixed z-50 min-w-[160px] rounded-md border-2 border-border bg-surface py-1 text-sm shadow-neoMd"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left"
            onClick={async () => {
              const file = await createBlankFile.mutateAsync({ name: "Untitled Note", folderId: contextMenu.folderId });
              setContextMenu(null);
              navigate(`/study/${file.id}`);
            }}
          >
            <NotebookPen className="h-3.5 w-3.5" /> New Note
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left"
            onClick={() => { onUploadToFolder(contextMenu.folderId); setContextMenu(null); }}
          >
            <FilePlus className="h-3.5 w-3.5" /> Upload File
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left"
            onClick={() => { setCreating(contextMenu.folderId); setContextMenu(null); }}
          >
            <FolderPlus className="h-3.5 w-3.5" /> New Subfolder
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left"
            onClick={() => {
              const f = folders.find((fo) => fo.id === contextMenu.folderId);
              if (f) { setRenaming(f.id); setRenameName(f.name); }
              setContextMenu(null);
            }}
          >
            <Pencil className="h-3.5 w-3.5" /> Rename Folder
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left text-destructive"
            onClick={() => {
              if (confirm("Delete this folder?")) deleteFolder.mutate(contextMenu.folderId);
              setContextMenu(null);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {fileContextMenu && (
        <div
          className="fixed z-50 min-w-[140px] rounded-md border-2 border-border bg-surface py-1 text-sm shadow-neoMd"
          style={{ left: fileContextMenu.x, top: fileContextMenu.y }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left"
            onClick={() => { handleFileRenameStart(fileContextMenu.fileId, fileContextMenu.fileName); setFileContextMenu(null); }}
          >
            <Pencil className="h-3.5 w-3.5" /> Rename
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-accent text-left text-destructive"
            onClick={() => {
              if (confirm("Delete this file?")) deleteFile.mutate(fileContextMenu.fileId);
              setFileContextMenu(null);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
