import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface DocumentFindBarProps {
  onQueryChange: (query: string) => void;
}

export default function DocumentFindBar({ onQueryChange }: DocumentFindBarProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onQueryChange(value.trim());
  };

  return (
    <div className="flex shrink-0 items-center gap-2 border-b-2 border-border bg-surface-muted px-3 py-2">
      <label htmlFor="doc-find" className="sr-only">
        Find in document
      </label>
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        id="doc-find"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Find in document…"
        className="h-9 min-h-9 flex-1 text-xs"
      />
      {query && (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => handleChange("")}
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
