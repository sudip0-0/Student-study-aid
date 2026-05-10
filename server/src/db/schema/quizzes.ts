import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { files } from "./files";

export const quizzes = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  questions: jsonb("questions").notNull(),
  score: integer("score"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
