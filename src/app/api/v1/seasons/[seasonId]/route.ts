import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateSeasonInputSchema } from "@/features/seasons/schema";
import {
  getSeasonHandler,
  updateSeasonHandler,
  deleteSeasonHandler,
} from "@/features/seasons/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ seasonId: string }> };

async function getFarmId(req: NextRequest): Promise<string> {
  const farmId = req.nextUrl.searchParams.get("farmId");
  if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
  return farmId;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { seasonId } = await params;
    const farmId = await getFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const season = await getSeasonHandler(ctx, seasonId, farmId);
    return apiOk(season);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { seasonId } = await params;
    const farmId = await getFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const body = await req.json();
    const parsed = UpdateSeasonInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const season = await updateSeasonHandler(ctx, seasonId, farmId, parsed.data);
    return apiOk(season);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { seasonId } = await params;
    const farmId = await getFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    await deleteSeasonHandler(ctx, seasonId, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
