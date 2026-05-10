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
        className="bg-card border rounded-lg p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between text-sm"
            >
              <span className="text-muted-foreground">{shortcut.description}</span>
              <kbd className="px-2 py-0.5 text-xs bg-muted rounded border font-mono">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
