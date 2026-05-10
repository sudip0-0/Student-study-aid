import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import HighlightPopover from "./HighlightPopover";
import { useHighlights, useCreateHighlight } from "../../hooks";
import type { Highlight } from "../../types";

interface DocxViewerProps {
  fileId: string;
  extractedText: string;
  focusHighlight?: Highlight | null;
  onFocusHandled?: () => void;
}

interface HighlightSelection {
  text: string;
  page: number;
  x: number;
  y: number;
}

const highlightColors: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-900/50",
  green: "bg-green-200 dark:bg-green-900/50",
  pink: "bg-pink-200 dark:bg-pink-900/50",
  blue: "bg-blue-200 dark:bg-blue-900/50",
};

function renderHighlightedText(text: string, highlights: Highlight[]): ReactNode[] {
  const validHighlights = highlights.filter((h) => h.text.length > 0);
  const nodes: ReactNode[] = [];
  let index = 0;

  while (index < text.length) {
    let nextHighlight: Highlight | null = null;
    let nextIndex = -1;

    for (const highlight of validHighlights) {
      const foundIndex = text.indexOf(highlight.text, index);
      if (foundIndex !== -1 && (nextIndex === -1 || foundIndex < nextIndex)) {
        nextIndex = foundIndex;
        nextHighlight = highlight;
      }
    }

    if (!nextHighlight || nextIndex === -1) {
      nodes.push(text.slice(index));
      break;
    }

    if (nextIndex > index) {
      nodes.push(text.slice(index, nextIndex));
    }

    nodes.push(
      <mark
        key={`${nextHighlight.id}-${nextIndex}`}
        data-highlight-id={nextHighlight.id}
        className={`${highlightColors[nextHighlight.color] || highlightColors.yellow} rounded px-0.5`}
      >
        {nextHighlight.text}
      </mark>
    );
    index = nextIndex + nextHighlight.text.length;
  }

  return nodes;
}

export default function DocxViewer({ fileId, extractedText, focusHighlight, onFocusHandled }: DocxViewerProps) {
  const [highlightSelection, setHighlightSelection] = useState<HighlightSelection | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: highlights = [] } = useHighlights(fileId);
  const createHighlight = useCreateHighlight();

  useEffect(() => {
    if (focusHighlight?.text && contentRef.current) {
      const escapedId = CSS.escape(focusHighlight.id);
      const mark = contentRef.current.querySelector(`[data-highlight-id="${escapedId}"]`);
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        onFocusHandled?.();
      }
    }
  }, [focusHighlight, onFocusHandled]);

  const handleTextSelect = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const text = selection.toString().trim();
    const rect = selection.getRangeAt(0).getBoundingClientRect();

    setHighlightSelection({
      text,
      page: 0,
      x: rect.left + rect.width / 2 - 112,
      y: rect.bottom + window.scrollY + 8,
    });
  }, []);

  const handleSaveHighlight = useCallback(
    (color: string) => {
      if (!highlightSelection) return;
      createHighlight.mutate({
        fileId,
        text: highlightSelection.text,
        color,
      });
      setHighlightSelection(null);
      window.getSelection()?.removeAllRanges();
    },
    [fileId, highlightSelection, createHighlight]
  );

  return (
    <div className="flex flex-col h-full relative">
      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-6 whitespace-pre-wrap text-sm leading-relaxed"
        onMouseUp={handleTextSelect}
      >
        {renderHighlightedText(extractedText, highlights)}
      </div>

      {highlights.length > 0 && (
        <div className="border-t p-2 shrink-0 space-y-1 max-h-32 overflow-y-auto">
          <p className="text-xs text-muted-foreground font-medium">Highlights:</p>
          {highlights.map((h: Highlight) => (
            <div
              key={h.id}
              className={`text-xs px-2 py-1 rounded border-l-2 ${
                h.color === "yellow" ? "bg-yellow-100 border-yellow-400 dark:bg-yellow-950 dark:border-yellow-600" :
                h.color === "green" ? "bg-green-100 border-green-400 dark:bg-green-950 dark:border-green-600" :
                h.color === "pink" ? "bg-pink-100 border-pink-400 dark:bg-pink-950 dark:border-pink-600" :
                "bg-blue-100 border-blue-400 dark:bg-blue-950 dark:border-blue-600"
              }`}
            >
              {h.text.length > 80 ? h.text.slice(0, 77) + "..." : h.text}
            </div>
          ))}
        </div>
      )}

      {highlightSelection && (
        <HighlightPopover
          selection={highlightSelection}
          onSave={handleSaveHighlight}
          onClose={() => setHighlightSelection(null)}
        />
      )}
    </div>
  );
}
