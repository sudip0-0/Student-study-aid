import { cn } from "../../lib/utils";

export type FileTypeFilter = "all" | "pdf" | "docx" | "txt";

interface FilterTabsProps {
  active: FileTypeFilter;
  onChange: (filter: FileTypeFilter) => void;
}

const tabs: { value: FileTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pdf", label: "PDF" },
  { value: "docx", label: "DOCX" },
  { value: "txt", label: "TXT" },
];

export default function FilterTabs({ active, onChange }: FilterTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto rounded-md border-2 border-border bg-surface-muted p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "min-h-9 rounded-sm border-2 px-3 py-1 font-mono text-xs font-extrabold transition-colors",
            active === tab.value
              ? "border-border bg-surface text-foreground shadow-neoSm"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
