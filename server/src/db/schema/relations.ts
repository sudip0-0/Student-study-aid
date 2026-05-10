import { relations } from "drizzle-orm";
import { users } from "./users";
import { folders } from "./folders";
import { files } from "./files";
import { notes } from "./notes";
import { highlights } from "./highlights";
import { quizzes } from "./quizzes";
import { flashcards } from "./flashcards";

export const usersRelations = relations(users, ({ many }) => ({
  folders: many(folders),
  files: many(files),
  notes: many(notes),
  highlights: many(highlights),
  quizzes: many(quizzes),
  flashcards: many(flashcards),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(users, { fields: [folders.userId], references: [users.id] }),
  parent: one(folders, { fields: [folders.parentId], references: [folders.id] }),
  children: many(folders),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, { fields: [files.userId], references: [users.id] }),
  folder: one(folders, { fields: [files.folderId], references: [folders.id] }),
  notes: many(notes),
  highlights: many(highlights),
  quizzes: many(quizzes),
  flashcards: many(flashcards),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  file: one(files, { fields: [notes.fileId], references: [files.id] }),
}));

export const highlightsRelations = relations(highlights, ({ one }) => ({
  user: one(users, { fields: [highlights.userId], references: [users.id] }),
  file: one(files, { fields: [highlights.fileId], references: [files.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one }) => ({
  user: one(users, { fields: [quizzes.userId], references: [users.id] }),
  file: one(files, { fields: [quizzes.fileId], references: [files.id] }),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  user: one(users, { fields: [flashcards.userId], references: [users.id] }),
  file: one(files, { fields: [flashcards.fileId], references: [files.id] }),
}));
