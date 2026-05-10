import { useState, useRef, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface HighlightPopoverProps {
  selection: { text: string; page: number; x: number; y: number };
  onSave: (color: string) => void;
  onClose: () => void;
}

const colors = [
  { value: "yellow", bg: "bg-yellow-300", ring: "ring-yellow-400" },
  { value: "green", bg: "bg-green-300", ring: "ring-green-400" },
  { value: "pink", bg: "bg-pink-300", ring: "ring-pink-400" },
  { value: "blue", bg: "bg-blue-300", ring: "ring-blue-400" },
];

export default function HighlightPopover({ selection, onSave, onClose }: HighlightPopoverProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const truncated = selection.text.length > 60 ? selection.text.slice(0, 57) + "..." : selection.text;

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-card border rounded-lg shadow-xl p-3 w-56"
      style={{ left: selection.x, top: selection.y }}
    >
      <p className="text-xs text-muted-foreground mb-2 truncate">{truncated}</p>
      <div className="flex items-center gap-1.5 mb-2">
        {colors.map((c) => (
          <button
            key={c.value}
            onClick={() => setPicked(c.value)}
            className={cn(
              "h-6 w-6 rounded-full transition-all",
              c.bg,
              picked === c.value && `ring-2 ring-offset-1 ${c.ring}`
            )}
          />
        ))}
      </div>
      <button
        onClick={() => picked && onSave(picked)}
        disabled={!picked}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-40 transition-opacity"
      >
        <Check className="h-3.5 w-3.5" />
        Save Highlight
      </button>
    </div>
  );
}
