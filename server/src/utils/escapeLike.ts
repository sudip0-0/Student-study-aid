/** Escape LIKE/ILIKE wildcards so user search input is treated literally. */
export function escapeLikePattern(q: string): string {
  return q.replace(/[%_\\]/g, "\\$&");
}
