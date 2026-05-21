import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateBlockInputSchema } from "@/features/locations/schema";
import { updateBlockHandler } from "@/features/locations/handlers";

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
    const parsed = UpdateBlockInputSchema.pick({ boundary: true, boundaryPolygon: true, boundary_polygon: true }).safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid geometry"));
    }

    const block = await updateBlockHandler(ctx, id, farmId, parsed.data);
    return apiOk(block);
  } catch (err) {
    return apiError(err);
  }
}
