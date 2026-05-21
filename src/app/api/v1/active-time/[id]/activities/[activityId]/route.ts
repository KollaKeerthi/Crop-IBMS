import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { removeActivityFromActiveTimeHandler } from "@/features/active-time/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ id: string; activityId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id: activeTimeId, activityId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    await removeActivityFromActiveTimeHandler(ctx, activeTimeId, activityId, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
