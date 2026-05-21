import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { deleteCropVarietyHandler } from "@/features/crops/handlers";

type Params = { params: Promise<{ cropId: string; varietyId: string }> };

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
