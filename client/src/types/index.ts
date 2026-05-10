export interface User {
  id: string;
  email: string;
  name: string;
  hasApiKey: boolean;
  aiModel: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  userId: string;
  parentId: string | null;
  name: string;
  color: string;
  createdAt: string;
}

export interface File {
  id: string;
  userId: string;
  folderId: string | null;
  name: string;
  type: "pdf" | "docx" | "txt";
  url: string;
  size: number;
  extractedText?: string | null;
  createdAt: string;
}

export interface Note {
  id: string;
  fileId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Highlight {
  id: string;
  fileId: string;
  text: string;
  color: "yellow" | "green" | "pink" | "blue";
  page: number | null;
  position: { x: number; y: number; width: number; height: number } | null;
  note?: string | null;
  createdAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  fileId: string;
  fileName?: string | null;
  title: string;
  questions: QuizQuestion[];
  score: number | null;
  attemptedAt: string | null;
  createdAt: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardDeck {
  id: string;
  fileId: string;
  deckName: string;
  cards: Flashcard[];
  createdAt: string;
}

export interface CheatsheetSection {
  title: string;
  points: string[];
}

export interface Cheatsheet {
  id: string;
  fileId: string;
  title: string;
  sections: CheatsheetSection[];
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
