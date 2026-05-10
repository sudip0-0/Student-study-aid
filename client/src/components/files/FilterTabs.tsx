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
    <div className="flex items-center gap-1 p-0.5 rounded-md bg-muted">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-sm transition-colors",
            active === tab.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
