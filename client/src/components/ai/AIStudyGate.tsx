import { Link } from "react-router-dom";
import type { File } from "../../types";
import { isAiReady, resolveExtractionStatus } from "../../lib/studyStatus";

interface AIStudyGateProps {
  file: File;
  hasApiKey: boolean;
  children: React.ReactNode;
}

export default function AIStudyGate({ file, hasApiKey, children }: AIStudyGateProps) {
  if (isAiReady(file, hasApiKey)) {
    return <>{children}</>;
  }

  if (!hasApiKey) {
    return (
      <div className="neo-empty space-y-3 p-6 text-center">
        <p className="text-sm font-extrabold">OpenRouter API key required</p>
        <p className="text-xs font-bold text-muted-foreground">
          Add your API key in Settings to use summaries, quizzes, flashcards, and chat.
        </p>
        <Link
          to="/settings"
          className="inline-flex min-h-10 items-center justify-center rounded-md border-2 border-border bg-primary px-4 py-2 text-xs font-extrabold shadow-neoSm"
        >
          Open Settings
        </Link>
      </div>
    );
  }

  const status = resolveExtractionStatus(file);

  if (status === "pending") {
    return (
      <div className="neo-empty p-6 text-center">
        <p className="text-sm font-extrabold">Document text is still processing</p>
        <p className="mt-2 text-xs font-bold text-muted-foreground">
          Wait for extraction to finish, then try again.
        </p>
      </div>
    );
  }

  return (
    <div className="neo-empty space-y-2 p-6 text-center">
      <p className="text-sm font-extrabold">AI needs extracted text</p>
      <p className="text-xs font-bold text-muted-foreground">
        {file.type === "pdf"
          ? "This PDF has no selectable text. Scanned PDFs are not supported without OCR."
          : "Extraction did not produce usable text. Use Re-parse on the banner above."}
      </p>
    </div>
  );
}
