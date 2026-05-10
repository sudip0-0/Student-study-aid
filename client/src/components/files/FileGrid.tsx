import { useNavigate } from "react-router-dom";
import FileCard from "./FileCard";
import { Skeleton } from "../shared/Skeleton";
import type { File as FileType } from "../../types";

interface FileGridProps {
  files: FileType[];
  isLoading: boolean;
  onRename: (file: FileType) => void;
}

export default function FileGrid({ files, isLoading, onRename }: FileGridProps) {
  const navigate = useNavigate();

  const handleSelect = (file: FileType) => {
    navigate(`/study/${file.id}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {files.map((file) => (
        <FileCard key={file.id} file={file} onSelect={handleSelect} onRename={onRename} />
      ))}
    </div>
  );
}
