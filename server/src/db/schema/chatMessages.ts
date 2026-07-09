import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { files } from "./files";

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileId: uuid("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  sortOrder: integer("sort_order").notNull().default(0),
});
