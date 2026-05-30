import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { UpdateCropTypeInputSchema } from "@/features/crops/schema";
import { deleteCropTypeHandler, updateCropTypeHandler } from "@/features/crops/handlers";

type Params = { params: Promise<{ cropId: string; typeId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId, typeId } = await params;
    const body = await req.json();
    const input = UpdateCropTypeInputSchema.parse(body);
    const type = await updateCropTypeHandler(ctx, cropId, typeId, input);
    return apiOk(type);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId, typeId } = await params;
    await deleteCropTypeHandler(ctx, cropId, typeId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
