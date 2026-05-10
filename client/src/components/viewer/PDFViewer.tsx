import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import HighlightPopover from "./HighlightPopover";
import { useHighlights, useCreateHighlight } from "../../hooks";
import type { Highlight } from "../../types";

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  fileId: string;
  fileUrl: string;
  focusHighlight?: Highlight | null;
  onFocusHandled?: () => void;
}

interface HighlightSelection {
  text: string;
  page: number;
  x: number;
  y: number;
  position: { x: number; y: number; width: number; height: number };
}

const pageWidth = 720;

const overlayColors: Record<string, string> = {
  yellow: "bg-yellow-300/45 border-yellow-400",
  green: "bg-green-300/45 border-green-400",
  pink: "bg-pink-300/45 border-pink-400",
  blue: "bg-blue-300/45 border-blue-400",
};

export default function PDFViewer({ fileId, fileUrl, focusHighlight, onFocusHandled }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [highlightSelection, setHighlightSelection] = useState<HighlightSelection | null>(null);
  const pageRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const { data: highlights = [] } = useHighlights(fileId);
  const createHighlight = useCreateHighlight();

  const handleDocumentLoad = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  useEffect(() => {
    if (focusHighlight?.page != null && pageRefs.current[focusHighlight.page]) {
      pageRefs.current[focusHighlight.page]?.scrollIntoView({ behavior: "smooth", block: "center" });
      onFocusHandled?.();
    }
  }, [focusHighlight, onFocusHandled]);

  const handleTextSelect = useCallback(
    (_e: React.MouseEvent, page: number) => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return;
      }

      const text = selection.toString().trim();
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const pageRect = pageRefs.current[page]?.getBoundingClientRect();
      if (!pageRect) return;

      const position = {
        x: rect.left - pageRect.left,
        y: rect.top - pageRect.top,
        width: rect.width,
        height: rect.height,
      };

      setHighlightSelection({
        text,
        page,
        x: rect.left + rect.width / 2 - 112,
        y: rect.bottom + window.scrollY + 8,
        position,
      });
    },
    []
  );

  const handleSaveHighlight = useCallback(
    (color: string) => {
      if (!highlightSelection) return;
      createHighlight.mutate({
        fileId,
        text: highlightSelection.text,
        color,
        page: highlightSelection.page,
        position: highlightSelection.position,
      });
      setHighlightSelection(null);
      window.getSelection()?.removeAllRanges();
    },
    [fileId, highlightSelection, createHighlight]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto relative">
        <Document file={fileUrl} onLoadSuccess={handleDocumentLoad} loading={<p className="text-sm text-muted-foreground p-4">Loading PDF...</p>} error={<p className="text-sm text-destructive p-4">Failed to load PDF.</p>}>
          <div className="flex flex-col items-center gap-4 py-4">
            {Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              const pageHighlights = highlights.filter((h: Highlight) => h.page === pageNumber && h.position);

              return (
                <div
                  key={pageNumber}
                  ref={(node) => { pageRefs.current[pageNumber] = node; }}
                  className="relative"
                  onMouseUp={(event) => handleTextSelect(event, pageNumber)}
                >
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer
                    renderAnnotationLayer={false}
                    width={pageWidth}
                  />
                  <div className="pointer-events-none absolute inset-0">
                    {pageHighlights.map((highlight) => {
                      const position = highlight.position!;
                      return (
                        <div
                          key={highlight.id}
                          title={highlight.text}
                          className={`absolute rounded-sm border ${overlayColors[highlight.color] || overlayColors.yellow}`}
                          style={{
                            left: position.x,
                            top: position.y,
                            width: position.width,
                            height: position.height,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Document>
      </div>

      <div className="flex items-center justify-center gap-4 py-2 border-t shrink-0">
        <span className="text-xs text-muted-foreground">
          {numPages ? `${numPages} page${numPages === 1 ? "" : "s"}` : "Loading pages..."}
        </span>
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
