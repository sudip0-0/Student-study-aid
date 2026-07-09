/** Max characters of document text sent to OpenRouter for file-scoped AI features. */
export const AI_DOC_CHAR_LIMIT = 12_000;

export function truncateText(text: string, maxLength: number = AI_DOC_CHAR_LIMIT): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).replace(/\s+\S*$/, "");
}

export function isAiTextTruncated(text: string, maxLength: number = AI_DOC_CHAR_LIMIT): boolean {
  return text.length > maxLength;
}
