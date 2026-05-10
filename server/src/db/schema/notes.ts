import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { files } from "./files";

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
