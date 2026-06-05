import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { listHierarchyHandler } from "@/features/locations/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    const hierarchy = await listHierarchyHandler(ctx, farmId);
    return apiOk(hierarchy);
  } catch (err) {
    return apiError(err);
  }
}
