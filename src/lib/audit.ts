import { headers } from "next/headers";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getClientIp } from "@/lib/log";

export type AuditAction =
  | "auth.signup"
  | "auth.login"
  | "auth.logout"
  | "auth.email_verified"
  | "auth.password_reset"
  | "user.updated"
  | "user.deleted"
  | "farm.created"
  | "farm.updated"
  | "farm.deleted"
  | "crop.created"
  | "crop.updated"
  | "crop.deleted"
  | "crop_type.created"
  | "crop_type.updated"
  | "crop_type.deleted"
  | "crop_variety.created"
  | "crop_variety.updated"
  | "crop_variety.deleted"
  | "season.created"
  | "season.updated"
  | "season.deleted"
  | "activity.created"
  | "activity.updated"
  | "activity.deleted"
  | "block_master.created"
  | "block_master.updated"
  | "block_master.deleted"
  | "density_master.created"
  | "density_master.updated"
  | "density_master.deleted"
  | "production_type.created"
  | "production_type.updated"
  | "production_type.deleted"
  | "production_site.created"
  | "production_site.updated"
  | "production_site.deleted"
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "task.status_changed"
  | "task_template.created"
  | "task_template.updated"
  | "task_template.deleted"
  | "event.created"
  | "event.updated"
  | "event.deleted"
  | "field.created"
  | "field.updated"
  | "field.deleted"
  | "greenhouse.created"
  | "greenhouse.updated"
  | "greenhouse.deleted"
  | "block.created"
  | "block.updated"
  | "block.deleted"
  | "team.member_invited"
  | "team.member_removed"
  | "team.role_updated"
  | "active_time.created"
  | "active_time.updated"
  | "active_time.deleted"
  | "active_time_activity.added"
  | "active_time_activity.removed"
  | "planting.created"
  | "planting.updated"
  | "planting.deleted"
  | "planting.status_changed"
  | "crop_data.created"
  | "crop_data.updated"
  | "crop_data.deleted"
  | "crop_data.status_changed"
  | "crop_data.section_updated"
  | "crop_data.collection_row_created"
  | "crop_data.collection_row_updated"
  | "crop_data.collection_row_deleted"
  | "crop_data.media_added"
  | "crop_data.media_deleted"
  | "crop_data.module_updated"
  | "sub_block.created"
  | "sub_block.updated"
  | "sub_block.deleted"
  | "farm_asset.created"
  | "farm_asset.updated"
  | "farm_asset.deleted"
  | "variability.created"
  | "variability.updated"
  | "variability.deleted"
  | "calendar_integration.connected"
  | "calendar_integration.disconnected";

type LogAuditParams = {
  userId: string | null;
  farmId?: string | null;
  action: AuditAction;
  resource: string;
  resourceName?: string | null;
  previousData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
};

async function readRequestMeta(): Promise<{ ip: string | null; userAgent: string | null }> {
  try {
    const h = await headers();
    return { ip: getClientIp(h), userAgent: h.get("user-agent") };
  } catch {
    return { ip: null, userAgent: null };
  }
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  const meta = await readRequestMeta();
  const resourceType = params.action.split(".")[0] ?? null;
  await db.insert(auditLogs).values({
    farmId: params.farmId ?? null,
    userId: params.userId,
    action: params.action,
    resourceType,
    resource: params.resource,
    resourceName: params.resourceName ?? null,
    previousData: params.previousData ?? null,
    newData: params.newData ?? null,
    metadata: params.metadata,
    previousValue: params.previousValue,
    newValue: params.newValue,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });
}
