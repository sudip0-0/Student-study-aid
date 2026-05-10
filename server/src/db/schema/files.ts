import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { folders } from "./folders";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  folderId: uuid("folder_id").references(() => folders.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  size: integer("size"),
  extractedText: text("extracted_text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
