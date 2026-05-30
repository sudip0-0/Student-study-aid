import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { files } from "../db/schema";
import { extractFileContent } from "./parsing.service";

export type ExtractionStatus = "pending" | "ready" | "failed";

export async function runFileExtraction(
  fileId: string,
  userId: string,
  fileType: string,
  url: string
): Promise<void> {
  await db
    .update(files)
    .set({ extractionStatus: "pending" })
    .where(and(eq(files.id, fileId), eq(files.userId, userId)));

  try {
    const { text, html } = await extractFileContent(fileType, url);
    const hasText = !!text && text.length > 0;

    await db
      .update(files)
      .set({
        extractedText: text,
        extractedHtml: fileType === "docx" ? html : null,
        extractionStatus: hasText ? "ready" : "failed",
      })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  } catch {
    await db
      .update(files)
      .set({ extractionStatus: "failed" })
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));
  }
}
