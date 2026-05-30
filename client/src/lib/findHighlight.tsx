import type { ReactNode } from "react";

export function highlightFindMatches(
  text: string,
  query: string,
  keyPrefix: string
): ReactNode[] {
  if (!query.trim()) return [text];

  const nodes: ReactNode[] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  let index = 0;
  let matchIndex = 0;

  while (index < text.length) {
    const found = lowerText.indexOf(lowerQuery, index);
    if (found === -1) {
      nodes.push(text.slice(index));
      break;
    }
    if (found > index) {
      nodes.push(text.slice(index, found));
    }
    const end = found + query.length;
    nodes.push(
      <mark
        key={`${keyPrefix}-${matchIndex}`}
        className="rounded bg-primary/30 px-0.5 ring-1 ring-primary"
      >
        {text.slice(found, end)}
      </mark>
    );
    index = end;
    matchIndex += 1;
  }

  return nodes;
}
