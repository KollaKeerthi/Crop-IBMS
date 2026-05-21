import { type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { calendarIntegrations } from "@/db/schema";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { logAudit } from "@/lib/audit";
import { isCalendarProvider } from "@/lib/integrations/calendar-oauth";

type Params = { params: Promise<{ provider: string }> };

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { provider } = await params;
    if (!isCalendarProvider(provider)) {
      throw new ApiError(400, "invalid_provider", "Unknown calendar provider.");
    }
    await db
      .delete(calendarIntegrations)
      .where(
        and(
          eq(calendarIntegrations.userId, ctx.userId),
          eq(calendarIntegrations.provider, provider)
        )
      );
    await logAudit({
      userId: ctx.userId,
      action: "calendar_integration.disconnected",
      resource: provider,
    });
    return apiOk(null);
  } catch (err) {
    return apiError(err);
  }
}
