import { truncateText } from "../utils/truncateText";

export function summarizePrompt(text: string, length: "short" | "medium" | "long" = "medium") {
  const bulletCount = length === "short" ? "5" : length === "medium" ? "10" : "15+";
  return {
    system: `You are a study assistant. Summarize the provided document content clearly and accurately.
Return ONLY the summary — no preamble, no "Here is a summary..." intro.
Use bullet points. Length: ${length} (${bulletCount} bullets).
Base your response ONLY on the provided content. Do not add any information not found in the document.`,
    user: `Document content:\n\n${truncateText(text, 12000)}`,
  };
}

export function quizPrompt(text: string, count = 5) {
  return {
    system: `You are a quiz generator. Generate ${count} multiple-choice questions from the document.
Respond ONLY with valid JSON. No markdown, no explanation, no preamble.
Base questions ONLY on the provided document content. Do not hallucinate.
Format: { "questions": [{ "question": "...", "options": ["A", "B", "C", "D"], "answer": "A", "explanation": "..." }] }
Each question must have exactly 4 options and one correct answer. Include a brief explanation for each.`,
    user: `Document content:\n\n${truncateText(text, 12000)}`,
  };
}

export function flashcardsPrompt(text: string, count = 10) {
  return {
    system: `You are a flashcard creator. Generate ${count} flashcards from the document.
Respond ONLY with valid JSON. No markdown, no explanation, no preamble.
Base cards ONLY on the provided document content. Do not hallucinate.
Format: { "cards": [{ "front": "...", "back": "..." }] }
Front should be a question or term. Back should be the answer or definition.`,
    user: `Document content:\n\n${truncateText(text, 12000)}`,
  };
}

export function cheatsheetPrompt(text: string) {
  return {
    system: `You are a study assistant. Create a structured cheatsheet from the document.
Return ONLY JSON. No markdown, no preamble, no explanation.
Base content ONLY on the provided document. Do not hallucinate.
Format: { "sections": [{ "title": "...", "points": ["...", "..."] }] }
Organize content into logical sections. Each section should have 3-7 bullet points.`,
    user: `Document content:\n\n${truncateText(text, 12000)}`,
  };
}

export function explainPrompt(text: string, level: "simple" | "moderate" | "detailed" = "moderate") {
  return {
    system: `You are a study assistant. Explain the provided text passage clearly and accurately.
Level of detail: ${level} (simple = ELI5, moderate = college student, detailed = graduate level).
Return ONLY the explanation — no preamble, no "Here is an explanation..." intro.
Base your explanation ONLY on the provided content. Do not add unrelated information.`,
    user: `Text to explain:\n\n${truncateText(text, 3000)}`,
  };
}

export function chatPrompt(text: string, history: { role: "user" | "assistant"; content: string }[]) {
  const system = `You are a study assistant. Answer questions about the provided document content.
Base your answers ONLY on the provided document. If the answer is not found in the document, say so clearly.
Be concise and accurate. Use bullet points for lists when helpful.`;

  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: `Document content:\n\n${truncateText(text, 12000)}` },
    { role: "assistant" as const, content: "I've read the document. Ask me anything about it." },
    ...history,
  ];

  return { messages };
}
