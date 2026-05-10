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
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border hover:bg-accent transition-colors"
      >
        <ArrowUpDown className="h-3 w-3" />
        <span>Sort</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 bg-card border rounded-md shadow-lg py-1 w-28">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-accent",
                value === option.value && "font-medium"
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
