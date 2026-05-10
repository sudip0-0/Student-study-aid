import { pgTable, uuid, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { files } from "./files";

export const highlights = pgTable("highlights", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  color: text("color").default("yellow"),
  page: integer("page"),
  position: jsonb("position"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
