import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateGreenhouseInputSchema } from "@/features/locations/schema";
import { updateGreenhouseHandler } from "@/features/locations/handlers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    const body = await req.json();
    const parsed = UpdateGreenhouseInputSchema.pick({ boundary: true, boundaryPolygon: true, boundary_polygon: true }).safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid geometry"));
    }

    const greenhouse = await updateGreenhouseHandler(ctx, id, farmId, parsed.data);
    return apiOk(greenhouse);
  } catch (err) {
    return apiError(err);
  }
}
