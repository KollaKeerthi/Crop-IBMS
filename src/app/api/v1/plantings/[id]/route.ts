import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdatePlantingInputSchema } from "@/features/plantings/schema";
import {
  getPlantingHandler,
  updatePlantingHandler,
  deletePlantingHandler,
} from "@/features/plantings/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ id: string }> };

async function resolveFarmId(req: NextRequest): Promise<string> {
  const farmId = req.nextUrl.searchParams.get("farmId");
  if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
  return farmId;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const planting = await getPlantingHandler(ctx, id, farmId);
    return apiOk(planting);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const body = await req.json();
    const parsed = UpdatePlantingInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const hasAccess = await checkFarmAccess(parsed.data.farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const planting = await updatePlantingHandler(ctx, id, parsed.data);
    return apiOk(planting);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    await deletePlantingHandler(ctx, id, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
