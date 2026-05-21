import { pgEnum, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { farms } from "./farms";

export const memberRoleEnum = pgEnum("member_role", ["OWNER", "MANAGER", "WORKER"]);

export const farmMemberships = pgTable(
  "farm_memberships",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("WORKER"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.farmId] })]
);
