import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { farms } from "./farms";

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    farmId: uuid("farm_id").references(() => farms.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    resourceType: text("resource_type"),
    resource: text("resource").notNull(),
    resourceName: text("resource_name"),
    previousData: jsonb("previous_data"),
    newData: jsonb("new_data"),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_farm_id_idx").on(table.farmId),
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_resource_type_idx").on(table.resourceType),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);
