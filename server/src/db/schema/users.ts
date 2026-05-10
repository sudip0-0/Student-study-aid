import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  apiKey: text("api_key"),
  aiModel: text("ai_model").notNull().default("openai/gpt-4o-mini"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
