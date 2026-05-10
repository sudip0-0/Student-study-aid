import { AnyPgColumn, pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

export const folders = pgTable("folders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parentId: uuid("parent_id").references((): AnyPgColumn => folders.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").default("#6366f1"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
