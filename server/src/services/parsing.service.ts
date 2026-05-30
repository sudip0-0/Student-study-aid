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

export type FileContentExtraction = {
  text: string | null;
  html: string | null;
};

async function extractDocxBoth(filePath: string): Promise<FileContentExtraction> {
  const mammoth = await import("mammoth");
  const buffer = fs.readFileSync(filePath);
  const [textResult, htmlResult] = await Promise.all([
    mammoth.extractRawText({ buffer }),
    mammoth.convertToHtml({ buffer }),
  ]);
  const text = stripExcessWhitespace(textResult.value);
  const html = htmlResult.value.trim();
  return {
    text: text || null,
    html: html || null,
  };
}

export async function extractFileContent(fileType: string, url: string): Promise<FileContentExtraction> {
  const ext = fileType === "pdf" ? ".pdf" : fileType === "docx" ? ".docx" : ".txt";
  const tmpPath = path.join(process.cwd(), "tmp", `${crypto.randomUUID()}${ext}`);

  fs.mkdirSync(path.dirname(tmpPath), { recursive: true });

  try {
    await downloadFile(url, tmpPath);

    if (fileType === "pdf") {
      const text = await extractPdfText(tmpPath);
      return { text: text || null, html: null };
    }
    if (fileType === "docx") {
      return extractDocxBoth(tmpPath);
    }
    const text = await extractTxtText(tmpPath);
    return { text: text || null, html: null };
  } catch (err) {
    console.error("File parsing failed:", err);
    return { text: null, html: null };
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      /* ignore */
    }
  }
}

/** @deprecated Use extractFileContent via runFileExtraction */
export async function parseFile(fileType: string, url: string): Promise<string | null> {
  const result = await extractFileContent(fileType, url);
  return result.text;
}

export async function parseDocxHtml(url: string): Promise<string | null> {
  const result = await extractFileContent("docx", url);
  return result.html;
}
