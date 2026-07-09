/** Keep in sync with server/src/utils/truncateText.ts */
export const AI_DOC_CHAR_LIMIT = 12_000;

export function isAiTextTruncated(text: string | null | undefined, maxLength = AI_DOC_CHAR_LIMIT): boolean {
  return (text?.length ?? 0) > maxLength;
}
