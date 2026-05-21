import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { UpdateVariabilityInputSchema } from "@/features/variability/schema";
import {
  updateVariabilityHandler,
  deleteVariabilityHandler,
} from "@/features/variability/handlers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = UpdateVariabilityInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "validation_error", firstError(parsed.error.issues, "Invalid input."));
    }
    return apiOk(await updateVariabilityHandler(ctx, id, parsed.data));
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    await deleteVariabilityHandler(ctx, id);
    return apiOk(null);
  } catch (err) {
    return apiError(err);
  }
}
