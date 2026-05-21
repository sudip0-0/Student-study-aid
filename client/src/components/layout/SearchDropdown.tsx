import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FileText, StickyNote, Loader2 } from "lucide-react";
import api from "../../lib/api";

interface SearchDropdownProps {
  query: string;
  onClose: () => void;
}

interface SearchResult {
  files: { id: string; name: string; type: string }[];
  notes: { id: string; fileId: string; content: string }[];
}

export default function SearchDropdown({ query, onClose }: SearchDropdownProps) {
  const { data, isLoading } = useQuery<SearchResult>({
    queryKey: ["search", query],
    queryFn: async () => {
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`);
      return data.data;
    },
    enabled: !!query.trim(),
  });

  const hasResults = data && (data.files.length > 0 || data.notes.length > 0);

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-auto rounded-neoLg border-2 border-border bg-surface shadow-neoMd">
      {isLoading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && !hasResults && (
        <p className="py-6 text-center text-xs font-bold text-muted-foreground">
          No results found.
        </p>
      )}

      {data?.files.map((file) => (
        <Link
          key={file.id}
          to={`/study/${file.id}`}
          onClick={onClose}
          className="flex items-center gap-2 border-b-2 border-border px-3 py-2 text-sm font-bold transition-colors hover:bg-accent"
        >
          <FileText className={`h-3.5 w-3.5 ${
            file.type === "pdf" ? "text-red-500" : file.type === "docx" ? "text-blue-500" : "text-green-500"
          }`} />
          <span className="truncate">{file.name}</span>
          <span className="text-[10px] text-muted-foreground uppercase ml-auto shrink-0">{file.type}</span>
        </Link>
      ))}

      {data?.notes.map((note) => (
        <Link
          key={note.id}
          to={`/study/${note.fileId}`}
          onClick={onClose}
          className="flex items-center gap-2 border-b-2 border-border px-3 py-2 text-sm font-bold transition-colors hover:bg-accent"
        >
          <StickyNote className="h-3.5 w-3.5 text-yellow-500" />
          <span className="truncate text-muted-foreground">
            {note.content.slice(0, 80)}{note.content.length > 80 ? "..." : ""}
          </span>
        </Link>
      ))}
    </div>
  );
}
