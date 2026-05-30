import { Button } from "../ui/button";
import type { File } from "../../types";
import { extractionBannerMessage, resolveExtractionStatus } from "../../lib/studyStatus";

interface ExtractionBannerProps {
  file: File;
  onReparse: () => void;
  isReparsing: boolean;
}

export default function ExtractionBanner({ file, onReparse, isReparsing }: ExtractionBannerProps) {
  const message = extractionBannerMessage(file);
  if (!message) return null;

  const status = resolveExtractionStatus(file);
  const isWarning = status === "failed";

  return (
    <div
      className={`shrink-0 flex flex-wrap items-center justify-between gap-2 border-b-2 border-border px-4 py-2 text-xs font-bold ${
        isWarning ? "bg-danger-soft text-foreground" : "bg-warning-soft text-foreground"
      }`}
      role="status"
    >
      <p className="min-w-0 flex-1">{message}</p>
      {isWarning && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 text-xs"
          onClick={onReparse}
          disabled={isReparsing}
        >
          {isReparsing ? "Re-parsing…" : "Re-parse file"}
        </Button>
      )}
    </div>
  );
}
