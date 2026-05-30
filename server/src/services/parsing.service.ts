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

export async function extractDocxHtml(filePath: string): Promise<string> {
  const mammoth = await import("mammoth");
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.convertToHtml({ buffer });
  return result.value.trim();
}

export async function extractTxtText(filePath: string): Promise<string> {
  const text = fs.readFileSync(filePath, "utf-8");
  return stripExcessWhitespace(text);
}

function stripExcessWhitespace(text: string): string {
  return text.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{3,}/g, "  ").trim();
}

async function withDownloadedFile(
  fileType: string,
  url: string,
  extract: (tmpPath: string) => Promise<string>
): Promise<string | null> {
  const ext = fileType === "pdf" ? ".pdf" : fileType === "docx" ? ".docx" : ".txt";
  const tmpPath = path.join(process.cwd(), "tmp", `${crypto.randomUUID()}${ext}`);

  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

  try {
    await downloadFile(url, tmpPath);
    return await extract(tmpPath);
  } catch (err) {
    console.error("File parsing failed:", err);
    return null;
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}

export async function parseFile(fileType: string, url: string): Promise<string | null> {
  if (fileType === "pdf") {
    return withDownloadedFile(fileType, url, extractPdfText);
  }
  if (fileType === "docx") {
    return withDownloadedFile(fileType, url, extractDocxText);
  }
  return withDownloadedFile(fileType, url, extractTxtText);
}

export async function parseDocxHtml(url: string): Promise<string | null> {
  return withDownloadedFile("docx", url, extractDocxHtml);
}
