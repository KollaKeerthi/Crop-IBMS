import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { toggleChecklistItemHandler } from "@/features/tasks/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ id: string; itemId: string }> };

const ToggleSchema = z.object({ completed: z.boolean() });

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { itemId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const body = await req.json();
    const parsed = ToggleSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    await toggleChecklistItemHandler(ctx, itemId, parsed.data.completed);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
