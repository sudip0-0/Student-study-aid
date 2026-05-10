import { useState, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Plus, Grid3X3, List, Search } from "lucide-react";
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
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("date");

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Breadcrumb
          activeFolderId={activeFolderId}
          folders={folders}
          onNavigate={setActiveFolderId}
        />
        <div className="flex items-center gap-2">
          <div className="flex border rounded-md">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 ${viewMode === "grid" ? "bg-accent" : "hover:bg-accent/50"}`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 ${viewMode === "list" ? "bg-accent" : "hover:bg-accent/50"}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowUploader(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <FilterTabs active={typeFilter} onChange={setTypeFilter} />
        <SortDropdown value={sortOption} onChange={setSortOption} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setRenamingFile(null)}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-3">Rename File</h3>
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
