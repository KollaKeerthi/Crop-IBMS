import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { CreateFarmAssetInputSchema } from "@/features/farm-assets/schema";
import { listFarmAssetsHandler, createFarmAssetHandler } from "@/features/farm-assets/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "missing_farm_id", "farmId is required.");
    return apiOk(await listFarmAssetsHandler(ctx, farmId));
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = CreateFarmAssetInputSchema.safeParse(body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input.")
      );
    return apiOk(await createFarmAssetHandler(ctx, parsed.data), 201);
  } catch (err) {
    return apiError(err);
  }
}
