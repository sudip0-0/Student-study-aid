import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Readable } from "stream";
import { finished } from "stream/promises";

async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download file: ${response.status}`);
  if (!response.body) throw new Error("Download response did not include a body");
  const fileStream = fs.createWriteStream(destPath);
  await finished(Readable.fromWeb(response.body).pipe(fileStream));
}

export async function extractPdfText(filePath: string): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  return stripExcessWhitespace(data.text);
}

export async function extractDocxText(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  return stripExcessWhitespace(result.value);
}

export async function extractTxtText(filePath: string): Promise<string> {
  const text = fs.readFileSync(filePath, "utf-8");
  return stripExcessWhitespace(text);
}

function stripExcessWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{3,}/g, "  ").trim();
}

export async function parseFile(fileType: string, url: string): Promise<string | null> {
  const ext = fileType === "pdf" ? ".pdf" : fileType === "docx" ? ".docx" : ".txt";
  const tmpPath = path.join(process.cwd(), "tmp", `${crypto.randomUUID()}${ext}`);

  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

  try {
    await downloadFile(url, tmpPath);

    if (fileType === "pdf") return await extractPdfText(tmpPath);
    if (fileType === "docx") return await extractDocxText(tmpPath);
    return await extractTxtText(tmpPath);
  } catch (err) {
    console.error("Text extraction failed:", err);
    return null;
  } finally {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}
