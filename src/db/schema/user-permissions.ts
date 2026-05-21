import { boolean, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { screens } from "./screens";

export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    screenId: uuid("screen_id")
      .notNull()
      .references(() => screens.id, { onDelete: "cascade" }),
    canView: boolean("can_view").notNull().default(false),
    canNew: boolean("can_new").notNull().default(false),
    canModify: boolean("can_modify").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    canApprove: boolean("can_approve").notNull().default(false),
    canCancel: boolean("can_cancel").notNull().default(false),
    canPrint: boolean("can_print").notNull().default(false),
    canProcess: boolean("can_process").notNull().default(false),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.screenId] })]
);
