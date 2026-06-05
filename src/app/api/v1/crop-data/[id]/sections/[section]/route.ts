import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { getSectionConfig } from "@/features/crop-data/sections";
import { updateSectionHandler } from "@/features/crop-data/handlers";

type Params = { params: Promise<{ id: string; section: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id, section } = await params;
    const config = getSectionConfig(section);
    if (!config) throw new ApiError(404, "not_found", "Unknown section.");
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = config.schema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        422,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    return apiOk(
      await updateSectionHandler(ctx, id, farmId, section, parsed.data as Record<string, unknown>)
    );
  } catch (err) {
    return apiError(err);
  }
}
