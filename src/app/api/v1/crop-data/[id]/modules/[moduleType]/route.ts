import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { UpdateModuleInputSchema } from "@/features/crop-data/schema";
import { updateModuleHandler } from "@/features/crop-data/handlers";

type Params = { params: Promise<{ id: string; moduleType: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id, moduleType } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = UpdateModuleInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        422,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    return apiOk(await updateModuleHandler(ctx, id, farmId, moduleType, parsed.data));
  } catch (err) {
    return apiError(err);
  }
}
