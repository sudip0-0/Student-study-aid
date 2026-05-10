import { pgTable, uuid, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { files } from "./files";

export const cheatsheets = pgTable("cheatsheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sections: jsonb("sections").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
