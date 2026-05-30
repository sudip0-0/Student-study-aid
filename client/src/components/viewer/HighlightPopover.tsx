import { useState, useRef, useEffect } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";
import { useExplain } from "../../hooks";
import { getApiErrorMessage } from "../../lib/api";
import AIErrorRetry from "../ai/AIErrorRetry";

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
  const [explanation, setExplanation] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const explainMutation = useExplain();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const truncated =
    selection.text.length > 60 ? `${selection.text.slice(0, 57)}...` : selection.text;

  const handleExplain = () => {
    setExplanation(null);
    explainMutation.mutate(
      { text: selection.text, level: "simple" },
      {
        onSuccess: (data) => setExplanation(data),
      }
    );
  };

  return (
    <div
      ref={ref}
      className="absolute z-50 w-64 rounded-lg border-2 border-border bg-card p-3 shadow-xl"
      style={{ left: selection.x, top: selection.y }}
    >
      <p className="mb-2 truncate text-xs text-muted-foreground">{truncated}</p>

      {explanation && (
        <p className="mb-2 max-h-24 overflow-auto rounded-md border border-border bg-surface-muted p-2 text-xs leading-relaxed">
          {explanation}
        </p>
      )}

      {explainMutation.isError && (
        <div className="mb-2">
          <AIErrorRetry
            message={getApiErrorMessage(explainMutation.error, "Could not explain selection")}
            onRetry={handleExplain}
            disabled={explainMutation.isPending}
          />
        </div>
      )}

      <div className="mb-2 flex items-center gap-1.5">
        {colors.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setPicked(c.value)}
            className={cn(
              "h-6 w-6 rounded-full transition-all",
              c.bg,
              picked === c.value && `ring-2 ring-offset-1 ${c.ring}`
            )}
            aria-label={`Highlight ${c.value}`}
          />
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={handleExplain}
          disabled={explainMutation.isPending}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border-2 border-border py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-40"
        >
          {explainMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          Explain
        </button>
        <button
          type="button"
          onClick={() => picked && onSave(picked)}
          disabled={!picked}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5" />
          Save Highlight
        </button>
      </div>
    </div>
  );
}
