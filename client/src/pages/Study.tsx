import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, StickyNote, Highlighter, Sparkles } from "lucide-react";
import PDFViewer from "../components/viewer/PDFViewer";
import DocxViewer from "../components/viewer/DocxViewer";
import HighlightList from "../components/viewer/HighlightList";
import NoteList from "../components/notes/NoteList";
import AIPanel from "../components/ai/AIPanel";
import ExtractionBanner from "../components/study/ExtractionBanner";
import DocumentFindBar from "../components/study/DocumentFindBar";
import { useFile, useUpdateFile, useReparseFile } from "../hooks";
import { useUIStore } from "../store/uiStore";
import { useAuthStore } from "../store/auth";
import { cn } from "../lib/utils";
import type { Highlight } from "../types";

export default function Study() {
  const { fileId } = useParams<{ fileId: string }>();
  const { data: file, isLoading, isError } = useFile(fileId || "");
  const { rightPanelTab, setRightPanelTab, pushRecentFile } = useUIStore();
  const hasApiKey = useAuthStore((s) => s.user?.hasApiKey ?? false);
  const [focusHighlight, setFocusHighlight] = useState<Highlight | null>(null);
  const [findQuery, setFindQuery] = useState("");
  const updateFile = useUpdateFile();
  const reparseFile = useReparseFile(fileId || "");
  const [noteText, setNoteText] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBlank = file?.url === "";

  useEffect(() => {
    if (file?.id) pushRecentFile(file.id);
  }, [file?.id, pushRecentFile]);

  useEffect(() => {
    if (file && isBlank) setNoteText(file.extractedText || "");
  }, [file?.id, isBlank]);

  const handleNoteChange = (value: string) => {
    setNoteText(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (file) updateFile.mutate({ id: file.id, extractedText: value });
    }, 800);
  };

  const handleJumpToHighlight = useCallback(
    (highlight: Highlight) => {
      setFocusHighlight(highlight);
      setRightPanelTab("highlights");
    },
    [setRightPanelTab]
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="neo-box px-5 py-3 text-sm font-bold text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Document not found.</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const tabs = [
    { key: "notes" as const, label: "Notes", icon: StickyNote },
    { key: "highlights" as const, label: "Highlights", icon: Highlighter },
    { key: "ai" as const, label: "AI", icon: Sparkles },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-3 border-b-2 border-border bg-surface px-3 py-2 sm:px-4">
        <Link
          to="/"
          className="rounded-md border-2 border-transparent p-1 hover:border-border hover:bg-accent"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {file.type === "pdf" ? (
            <FileText className="h-4 w-4 shrink-0 text-red-500" />
          ) : file.type === "docx" ? (
            <FileText className="h-4 w-4 shrink-0 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 shrink-0 text-green-500" />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold">{file.name}</p>
            <p className="font-mono text-[10px] font-bold uppercase text-muted-foreground">{file.type}</p>
          </div>
        </div>
      </div>

      {!isBlank && (
        <ExtractionBanner
          file={file}
          onReparse={() => reparseFile.mutate()}
          isReparsing={reparseFile.isPending}
        />
      )}

      {!isBlank && <DocumentFindBar onQueryChange={setFindQuery} />}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="min-h-[45dvh] min-w-0 flex-[3] overflow-hidden border-b-2 border-border lg:min-h-0 lg:border-b-0 lg:border-r-2">
          {file.type === "pdf" ? (
            <PDFViewer
              fileId={file.id}
              fileUrl={file.url}
              extractedText={file.extractedText || ""}
              findQuery={findQuery}
              focusHighlight={focusHighlight}
              onFocusHandled={() => setFocusHighlight(null)}
            />
          ) : isBlank ? (
            <div className="flex h-full flex-col p-4">
              <textarea
                className="flex-1 w-full resize-none rounded-neoLg border-2 border-border bg-surface p-4 text-sm font-medium leading-relaxed shadow-neoSm focus:outline-none placeholder:text-muted-foreground"
                placeholder="Start typing your notes..."
                value={noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
              />
              {updateFile.isPending && (
                <p className="mt-1 text-xs text-muted-foreground">Saving...</p>
              )}
            </div>
          ) : (
            <DocxViewer
              fileId={file.id}
              fileType={file.type === "docx" ? "docx" : "txt"}
              extractedText={file.extractedText || "No text could be extracted from this document."}
              extractedHtml={file.extractedHtml}
              findQuery={findQuery}
              focusHighlight={focusHighlight}
              onFocusHandled={() => setFocusHighlight(null)}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-[2] flex-col overflow-hidden bg-surface">
          <div className="flex shrink-0 gap-1 overflow-x-auto border-b-2 border-border bg-surface-muted p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRightPanelTab(tab.key)}
                className={cn(
                  "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-md border-2 px-2 py-2 text-xs font-extrabold transition-colors",
                  rightPanelTab === tab.key
                    ? "border-border bg-accent text-foreground shadow-neoSm"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={rightPanelTab === tab.key}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {rightPanelTab === "notes" && <NoteList fileId={file.id} />}
            {rightPanelTab === "highlights" && (
              <HighlightList fileId={file.id} onJumpToHighlight={handleJumpToHighlight} />
            )}
            {rightPanelTab === "ai" && (
              <AIPanel fileId={file.id} file={file} hasApiKey={hasApiKey} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
