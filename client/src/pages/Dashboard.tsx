import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Grid3X3, List, Search, FolderOpen, FileText } from "lucide-react";
import FileGrid from "../components/files/FileGrid";
import FileList from "../components/files/FileList";
import FileUploader from "../components/files/FileUploader";
import FilterTabs from "../components/files/FilterTabs";
import SortDropdown from "../components/files/SortDropdown";
import Breadcrumb from "../components/layout/Breadcrumb";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useUIStore } from "../store/uiStore";
import { useFiles, useFolders, useUpdateFile } from "../hooks";
import type { File as FileType } from "../types";
import type { FileTypeFilter } from "../components/files/FilterTabs";
import type { SortOption } from "../components/files/SortDropdown";

const SORT_STORAGE_KEY = "lumio:dashboard:sort";
const FILTER_STORAGE_KEY = "lumio:dashboard:typeFilter";

function readStoredSort(): SortOption {
  const value = localStorage.getItem(SORT_STORAGE_KEY);
  if (value === "name" || value === "date" || value === "size") return value;
  return "date";
}

function readStoredFilter(): FileTypeFilter {
  const value = localStorage.getItem(FILTER_STORAGE_KEY);
  if (value === "all" || value === "pdf" || value === "docx" || value === "txt") return value;
  return "all";
}

export default function Dashboard() {
  const { activeFolderId, setActiveFolderId } = useOutletContext<{
    activeFolderId: string | null;
    setActiveFolderId: (id: string | null) => void;
  }>();
  const { viewMode, setViewMode } = useUIStore();

  const { data: files = [], isLoading } = useFiles(activeFolderId ?? undefined);
  const { data: folders = [] } = useFolders();

  const [showUploader, setShowUploader] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileType | null>(null);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>(readStoredFilter);
  const [sortOption, setSortOption] = useState<SortOption>(readStoredSort);

  const handleTypeFilterChange = (filter: FileTypeFilter) => {
    setTypeFilter(filter);
    localStorage.setItem(FILTER_STORAGE_KEY, filter);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
    localStorage.setItem(SORT_STORAGE_KEY, sort);
  };

  const updateFile = useUpdateFile();

  const handleRename = async () => {
    if (!renamingFile || !newName.trim()) return;
    await updateFile.mutateAsync({ id: renamingFile.id, name: newName.trim() });
    setRenamingFile(null);
    setNewName("");
  };

  const filteredFiles = useMemo(() => {
    let result = files;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.name.toLowerCase().includes(q));
    }

    if (typeFilter !== "all") {
      result = result.filter((f) => f.type === typeFilter);
    }

    switch (sortOption) {
      case "name":
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "date":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "size":
        result = [...result].sort((a, b) => b.size - a.size);
        break;
    }

    return result;
  }, [files, searchQuery, typeFilter, sortOption]);

  const activeFolder = folders.find((folder) => folder.id === activeFolderId);

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="app-panel overflow-hidden">
        <div className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-end md:p-5">
          <div className="min-w-0 space-y-2">
            <Breadcrumb
              activeFolderId={activeFolderId}
              folders={folders}
              onNavigate={setActiveFolderId}
            />
            <div>
              <p className="font-mono text-[11px] font-extrabold uppercase text-muted-foreground">
                {activeFolder ? "Folder" : "Library"}
              </p>
              <h1 className="app-section-title truncate text-3xl sm:text-4xl">
                {activeFolder?.name ?? "All study files"}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <span className="status-pill bg-accent-soft">
              <FileText className="h-3.5 w-3.5" />
              {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
            </span>
            <span className="status-pill bg-primary-soft">
              <FolderOpen className="h-3.5 w-3.5" />
              {folders.length} folder{folders.length !== 1 ? "s" : ""}
            </span>
            <Button size="sm" onClick={() => setShowUploader(true)} className="ml-0 md:ml-2">
              <Plus className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        </div>
      </section>

      <div className="app-panel flex flex-col gap-3 p-3 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files in this view..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-10 pl-8 text-sm shadow-none"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center md:ml-auto">
          <FilterTabs active={typeFilter} onChange={handleTypeFilterChange} />
          <SortDropdown value={sortOption} onChange={handleSortChange} />
          <div className="flex w-fit rounded-md border-2 border-border bg-surface p-1 shadow-neoSm">
            <button
              onClick={() => setViewMode("grid")}
              className={`min-h-9 min-w-9 rounded-sm p-1.5 transition-colors ${viewMode === "grid" ? "bg-accent" : "hover:bg-accent-soft"}`}
              aria-label="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`min-h-9 min-w-9 rounded-sm p-1.5 transition-colors ${viewMode === "list" ? "bg-accent" : "hover:bg-accent-soft"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <FileGrid files={filteredFiles} isLoading={isLoading} onRename={setRenamingFile} />
      ) : (
        <FileList files={filteredFiles} isLoading={isLoading} folderId={activeFolderId} onRename={setRenamingFile} />
      )}

      {showUploader && (
        <FileUploader folderId={activeFolderId} onClose={() => setShowUploader(false)} />
      )}

      {renamingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setRenamingFile(null)}>
          <div className="neo-box w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="rename-file-title">
            <h3 id="rename-file-title" className="mb-3 text-lg font-extrabold">Rename File</h3>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") setRenamingFile(null);
              }}
              placeholder={renamingFile.name}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={() => setRenamingFile(null)}>Cancel</Button>
              <Button size="sm" onClick={handleRename} disabled={updateFile.isPending}>Rename</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
