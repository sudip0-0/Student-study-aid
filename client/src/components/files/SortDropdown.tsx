import { useState, useRef, useEffect } from "react";
import { ArrowUpDown, Check } from "lucide-react";
import { cn } from "../../lib/utils";

export type SortOption = "name" | "date" | "size";

interface SortDropdownProps {
  value: SortOption;
  onChange: (option: SortOption) => void;
}

const options: { value: SortOption; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date" },
  { value: "size", label: "Size" },
];

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex min-h-10 items-center gap-1.5 rounded-md border-2 border-border bg-surface px-3 py-1 text-xs font-extrabold shadow-neoSm transition-colors hover:bg-accent"
      >
        <ArrowUpDown className="h-3 w-3" />
        <span>Sort</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-28 rounded-md border-2 border-border bg-surface py-1 shadow-neoMd">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center justify-between px-3 py-2 text-left text-xs font-bold hover:bg-accent",
                value === option.value && "bg-accent-soft font-extrabold"
              )}
            >
              {option.label}
              {value === option.value && <Check className="h-3 w-3" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
