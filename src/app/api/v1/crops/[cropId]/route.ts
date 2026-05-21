import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateCropInputSchema } from "@/features/crops/schema";
import { getCropHandler, updateCropHandler, deleteCropHandler } from "@/features/crops/handlers";

type Params = { params: Promise<{ cropId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId } = await params;
    const crop = await getCropHandler(ctx, cropId);
    return apiOk(crop);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId } = await params;
    const body = await req.json();
    const parsed = UpdateCropInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const crop = await updateCropHandler(ctx, cropId, parsed.data);
    return apiOk(crop);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId } = await params;
    await deleteCropHandler(ctx, cropId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
