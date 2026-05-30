import type { File } from "../types";

export type ExtractionStatus = "pending" | "ready" | "failed";

export function resolveExtractionStatus(file: File): ExtractionStatus {
  if (file.extractionStatus) return file.extractionStatus;
  if (file.url === "") return "ready";
  if (file.extractedText && file.extractedText.length > 0) return "ready";
  return "pending";
}

export function isAiReady(file: File, hasApiKey: boolean): boolean {
  return hasApiKey && resolveExtractionStatus(file) === "ready" && !!file.extractedText?.trim();
}

export function extractionBannerMessage(file: File): string | null {
  const status = resolveExtractionStatus(file);
  if (file.url === "") return null;

  if (status === "pending") {
    return "Extracting document text… AI features unlock once extraction finishes.";
  }

  if (status === "failed") {
    if (file.type === "pdf") {
      return "No text could be extracted. This PDF may be scanned or image-only. AI needs selectable text (OCR is not supported yet). Try re-parse or upload a text-based PDF.";
    }
    return "Text extraction failed. Try re-parse or upload the file again.";
  }

  return null;
}
