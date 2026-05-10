import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, StickyNote, Highlighter, Sparkles } from "lucide-react";
import PDFViewer from "../components/viewer/PDFViewer";
import DocxViewer from "../components/viewer/DocxViewer";
import HighlightList from "../components/viewer/HighlightList";
import NoteList from "../components/notes/NoteList";
import AIPanel from "../components/ai/AIPanel";
import { useFile, useUpdateFile } from "../hooks";
import { useUIStore } from "../store/uiStore";
import { cn } from "../lib/utils";
import type { Highlight } from "../types";

export default function Study() {
  const { fileId } = useParams<{ fileId: string }>();
  const { data: file, isLoading, isError } = useFile(fileId || "");
  const { rightPanelTab, setRightPanelTab } = useUIStore();
  const [focusHighlight, setFocusHighlight] = useState<Highlight | null>(null);
  const updateFile = useUpdateFile();
  const [noteText, setNoteText] = useState("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isBlank = file?.url === "";

  useEffect(() => {
    if (file && isBlank) setNoteText(file.extractedText || "");
  }, [file?.id]);

  const handleNoteChange = (value: string) => {
    setNoteText(value);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (file) updateFile.mutate({ id: file.id, extractedText: value });
    }, 800);
  };

  const handleJumpToHighlight = useCallback((highlight: Highlight) => {
    setFocusHighlight(highlight);
    setRightPanelTab("highlights");
  }, [setRightPanelTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">Loading document...</p>
      </div>
    );
  }

  if (isError || !file) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-muted-foreground">Document not found.</p>
        <Link to="/" className="text-sm text-primary hover:underline">Back to Dashboard</Link>
      </div>
    );
  }

  const tabs = [
    { key: "notes" as const, label: "Notes", icon: StickyNote },
    { key: "highlights" as const, label: "Highlights", icon: Highlighter },
    { key: "ai" as const, label: "AI", icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2 border-b shrink-0">
        <Link to="/" className="p-1 rounded hover:bg-accent">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          {file.type === "pdf" ? (
            <FileText className="h-4 w-4 text-red-500 shrink-0" />
          ) : file.type === "docx" ? (
            <FileText className="h-4 w-4 text-blue-500 shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-green-500 shrink-0" />
          )}
          <span className="text-sm font-medium truncate">{file.name}</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="flex-[3] min-w-0 border-r overflow-hidden">
          {file.type === "pdf" ? (
            <PDFViewer
              fileId={file.id}
              fileUrl={file.url}
              focusHighlight={focusHighlight}
              onFocusHandled={() => setFocusHighlight(null)}
            />
          ) : isBlank ? (
            <div className="h-full flex flex-col p-4">
              <textarea
                className="flex-1 w-full resize-none bg-transparent text-sm leading-relaxed focus:outline-none placeholder:text-muted-foreground"
                placeholder="Start typing your notes..."
                value={noteText}
                onChange={(e) => handleNoteChange(e.target.value)}
              />
              {updateFile.isPending && (
                <p className="text-xs text-muted-foreground mt-1">Saving...</p>
              )}
            </div>
          ) : (
            <DocxViewer
              fileId={file.id}
              extractedText={file.extractedText || "No text could be extracted from this document."}
              focusHighlight={focusHighlight}
              onFocusHandled={() => setFocusHighlight(null)}
            />
          )}
        </div>

        <div className="flex-[2] min-w-0 flex flex-col bg-card overflow-hidden">
          <div className="flex border-b shrink-0">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRightPanelTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors border-b-2",
                  rightPanelTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-auto p-3">
            {rightPanelTab === "notes" && (
              <NoteList fileId={file.id} />
            )}
            {rightPanelTab === "highlights" && (
              <HighlightList
                fileId={file.id}
                onJumpToHighlight={handleJumpToHighlight}
              />
            )}
            {rightPanelTab === "ai" && (
              <AIPanel fileId={file.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
