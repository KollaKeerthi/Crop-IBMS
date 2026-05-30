import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { getCollectionConfig } from "@/features/crop-data/collections";
import { createCollectionRowHandler } from "@/features/crop-data/handlers";

type Params = { params: Promise<{ id: string; collection: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id, collection } = await params;
    const config = getCollectionConfig(collection);
    if (!config) throw new ApiError(404, "not_found", "Unknown collection.");
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = config.schema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input."));
    return apiOk(
      await createCollectionRowHandler(
        ctx,
        id,
        farmId,
        collection,
        parsed.data as Record<string, unknown>
      )
    );
  } catch (err) {
    return apiError(err);
  }
}
