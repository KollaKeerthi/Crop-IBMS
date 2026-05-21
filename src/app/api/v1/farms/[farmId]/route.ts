import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateFarmInputSchema } from "@/features/farms/schema";
import {
  getFarmHandler,
  updateFarmHandler,
  deleteFarmHandler,
} from "@/features/farms/handlers";

type Params = { params: Promise<{ farmId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { farmId } = await params;
    const farm = await getFarmHandler(ctx, farmId);
    return apiOk(farm);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { farmId } = await params;
    const body = await req.json();
    const parsed = UpdateFarmInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const farm = await updateFarmHandler(ctx, farmId, parsed.data);
    return apiOk(farm);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { farmId } = await params;
    await deleteFarmHandler(ctx, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
