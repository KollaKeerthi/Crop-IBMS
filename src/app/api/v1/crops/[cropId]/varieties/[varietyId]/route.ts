import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { UpdateCropVarietyInputSchema } from "@/features/crops/schema";
import { deleteCropVarietyHandler, updateCropVarietyHandler } from "@/features/crops/handlers";

type Params = { params: Promise<{ cropId: string; varietyId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId, varietyId } = await params;
    const body = await req.json();
    const input = UpdateCropVarietyInputSchema.parse(body);
    const variety = await updateCropVarietyHandler(ctx, cropId, varietyId, input);
    return apiOk(variety);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId, varietyId } = await params;
    await deleteCropVarietyHandler(ctx, cropId, varietyId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
