import { useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: "?", description: "Show/hide this help dialog" },
  { keys: "Ctrl + K", description: "Focus search" },
  { keys: "G then D", description: "Go to Dashboard" },
  { keys: "G then Q", description: "Go to Quizzes" },
  { keys: "G then S", description: "Go to Settings" },
  { keys: "Esc", description: "Close modal / cancel" },
];

export default function KeyboardShortcuts({ onClose }: KeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="neo-box w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-extrabold">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="rounded-md border-2 border-transparent p-1 hover:border-border hover:bg-accent" aria-label="Close keyboard shortcuts">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between gap-4 rounded-md border-2 border-border bg-surface-muted px-3 py-2 text-sm"
            >
              <span className="font-bold text-muted-foreground">{shortcut.description}</span>
              <kbd className="rounded border-2 border-border bg-surface px-2 py-0.5 font-mono text-xs font-extrabold shadow-neoSm">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
