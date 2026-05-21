import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateActiveTimeInputSchema } from "@/features/active-time/schema";
import { listActiveTimesHandler, createActiveTimeHandler } from "@/features/active-time/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const items = await listActiveTimesHandler(ctx, farmId);
    return apiOk(items);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const { farmId, ...rest } = body;
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const parsed = CreateActiveTimeInputSchema.safeParse(rest);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const item = await createActiveTimeHandler(ctx, farmId, parsed.data);
    return apiOk(item, 201);
  } catch (err) {
    return apiError(err);
  }
}
