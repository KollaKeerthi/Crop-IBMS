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
  | "production_site.created"
  | "production_site.updated"
  | "production_site.deleted"
  | "task.created"
  | "task.updated"
  | "task.deleted"
  | "task.status_changed"
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
  | "planting.created"
  | "planting.updated"
  | "planting.deleted"
  | "crop_data.created"
  | "crop_data.updated"
  | "crop_data.deleted"
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
  action: AuditAction;
  resource: string;
  metadata?: Record<string, unknown>;
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
  await db.insert(auditLogs).values({
    userId: params.userId,
    action: params.action,
    resource: params.resource,
    metadata: params.metadata,
    ipAddress: meta.ip,
    userAgent: meta.userAgent,
  });
}
