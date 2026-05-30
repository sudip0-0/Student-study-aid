import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import HighlightPopover from "./HighlightPopover";
import { useHighlights, useCreateHighlight, useDocxPreview } from "../../hooks";
import { getApiErrorMessage } from "../../lib/api";
import { highlightFindMatches } from "../../lib/findHighlight";
import type { Highlight } from "../../types";

interface DocxViewerProps {
  fileId: string;
  fileType: "docx" | "txt";
  extractedText: string;
  extractedHtml?: string | null;
  findQuery?: string;
  focusHighlight?: Highlight | null;
  onFocusHandled?: () => void;
}

interface HighlightSelection {
  text: string;
  page: number;
  x: number;
  y: number;
}

type ViewMode = "formatted" | "plain";

const DOCX_VIEW_KEY = "lumio:docxViewMode";

const highlightColors: Record<string, string> = {
  yellow: "bg-yellow-200 dark:bg-yellow-900/50",
  green: "bg-green-200 dark:bg-green-900/50",
  pink: "bg-pink-200 dark:bg-pink-900/50",
  blue: "bg-blue-200 dark:bg-blue-900/50",
};

function readViewMode(): ViewMode {
  const value = localStorage.getItem(DOCX_VIEW_KEY);
  return value === "plain" ? "plain" : "formatted";
}

function sanitizeDocxHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

function renderHighlightedText(
  text: string,
  highlights: Highlight[],
  findQuery: string
): ReactNode[] {
  const validHighlights = highlights.filter((h) => h.text.length > 0);
  if (validHighlights.length === 0) {
    return highlightFindMatches(text, findQuery, "find");
  }

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
      nodes.push(...highlightFindMatches(text.slice(index), findQuery, `tail-${index}`));
      break;
    }

    if (nextIndex > index) {
      nodes.push(
        ...highlightFindMatches(text.slice(index, nextIndex), findQuery, `seg-${index}`)
      );
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

export default function DocxViewer({
  fileId,
  fileType,
  extractedText,
  extractedHtml,
  findQuery = "",
  focusHighlight,
  onFocusHandled,
}: DocxViewerProps) {
  const [highlightSelection, setHighlightSelection] = useState<HighlightSelection | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);
  const contentRef = useRef<HTMLDivElement>(null);

  const isDocx = fileType === "docx";
  const cachedHtml = extractedHtml?.trim() || null;
  const {
    data: fetchedHtml,
    isLoading: previewLoading,
    isError: previewError,
    error: previewErrorDetail,
  } = useDocxPreview(fileId, isDocx, !!cachedHtml);

  const docxHtml = cachedHtml || fetchedHtml;
  const { data: highlights = [] } = useHighlights(fileId);
  const createHighlight = useCreateHighlight();
  const hasHighlights = highlights.length > 0;

  const canShowFormatted = isDocx && !!docxHtml && !previewError;
  const showFormatted = canShowFormatted && viewMode === "formatted";

  const setViewModePersisted = (mode: ViewMode) => {
    localStorage.setItem(DOCX_VIEW_KEY, mode);
    setViewMode(mode);
  };

  useEffect(() => {
    if (focusHighlight?.text) {
      setViewModePersisted("plain");
    }
  }, [focusHighlight?.id]);

  useEffect(() => {
    if (hasHighlights && viewMode === "formatted" && isDocx) {
      setViewModePersisted("plain");
    }
  }, [hasHighlights, isDocx]);

  useEffect(() => {
    if (focusHighlight?.text && contentRef.current && viewMode === "plain") {
      const escapedId = CSS.escape(focusHighlight.id);
      const mark = contentRef.current.querySelector(`[data-highlight-id="${escapedId}"]`);
      if (mark) {
        mark.scrollIntoView({ behavior: "smooth", block: "center" });
        onFocusHandled?.();
      }
    }
  }, [focusHighlight, onFocusHandled, viewMode]);

  const handleTextSelect = useCallback((e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const text = selection.toString().trim();
    const rect = selection.getRangeAt(0).getBoundingClientRect();

    setHighlightSelection({
      text,
      page: 0,
      x: rect.left + rect.width / 2 - 128,
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
    <div className="relative flex h-full flex-col">
      {isDocx && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-2 border-border bg-surface-muted px-3 py-2">
          <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
            {previewLoading && !cachedHtml
              ? "Loading formatted view…"
              : showFormatted
                ? "Formatted document"
                : "Plain text"}
          </p>
          {canShowFormatted && (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewModePersisted("formatted")}
                className={`rounded-md border-2 px-2 py-1 text-[10px] font-extrabold ${
                  viewMode === "formatted"
                    ? "border-border bg-accent shadow-neoSm"
                    : "border-transparent text-muted-foreground hover:border-border"
                }`}
              >
                Formatted
              </button>
              <button
                type="button"
                onClick={() => setViewModePersisted("plain")}
                className={`rounded-md border-2 px-2 py-1 text-[10px] font-extrabold ${
                  viewMode === "plain"
                    ? "border-border bg-accent shadow-neoSm"
                    : "border-transparent text-muted-foreground hover:border-border"
                }`}
              >
                Plain text
              </button>
            </div>
          )}
        </div>
      )}

      {hasHighlights && isDocx && (
        <p className="shrink-0 border-b border-border bg-warning-soft px-3 py-1.5 text-[10px] font-bold">
          Highlights appear in plain text view. Formatted layout does not show saved highlights yet.
        </p>
      )}

      <div
        ref={contentRef}
        className="flex-1 overflow-auto p-6 text-sm leading-relaxed"
        onMouseUp={handleTextSelect}
      >
        {isDocx && previewLoading && !cachedHtml && (
          <p className="text-xs font-bold text-muted-foreground">Rendering document layout…</p>
        )}

        {isDocx && previewError && !cachedHtml && !previewLoading && (
          <p className="mb-3 rounded-md border-2 border-border bg-warning-soft px-3 py-2 text-xs font-bold">
            {getApiErrorMessage(previewErrorDetail, "Formatted preview unavailable")}. Showing plain
            text.
          </p>
        )}

        {showFormatted ? (
          <article
            className="docx-preview max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeDocxHtml(docxHtml) }}
          />
        ) : (
          <div className="whitespace-pre-wrap">
            {renderHighlightedText(extractedText, highlights, findQuery)}
          </div>
        )}
      </div>

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
