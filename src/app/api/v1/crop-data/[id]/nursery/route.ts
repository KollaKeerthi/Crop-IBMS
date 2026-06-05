import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { UpdateNurseryInputSchema } from "@/features/crop-data/schema";
import { updateNurseryHandler } from "@/features/crop-data/handlers";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = UpdateNurseryInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        422,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    return apiOk(await updateNurseryHandler(ctx, id, farmId, parsed.data));
  } catch (err) {
    return apiError(err);
  }
}
