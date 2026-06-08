import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { logAudit } from "@/lib/audit";
import { UpdateProductionTypeInputSchema } from "@/features/production-types/schema";
import { getProductionTypeById } from "@/features/production-types/queries";
import { updateProductionType, deleteProductionType } from "@/features/production-types/mutations";
import { assertProductionTypeCanDelete } from "@/features/crop-information/delete-guards";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await getProductionTypeById(id);
    if (!existing) throw new ApiError(404, "not_found", "Production type not found.");
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = UpdateProductionTypeInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    const updated = await updateProductionType(id, parsed.data);
    await logAudit({
      userId: ctx.userId,
      action: "production_type.updated",
      resource: id,
      previousValue: existing,
      newValue: updated,
    });
    return apiOk(updated);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const existing = await getProductionTypeById(id);
    if (!existing) throw new ApiError(404, "not_found", "Production type not found.");
    await assertProductionTypeCanDelete(id);
    await deleteProductionType(id);
    await logAudit({
      userId: ctx.userId,
      action: "production_type.deleted",
      resource: id,
      previousValue: existing,
    });
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
