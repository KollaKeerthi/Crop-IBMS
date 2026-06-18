import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["OWNER", "MANAGER", "WORKER"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("OWNER"),
  primaryFarmId: uuid("primary_farm_id"), // set after first farm is created
  // Bumped on every password change; older JWTs (issued before this) are rejected.
  passwordChangedAt: timestamp("password_changed_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
