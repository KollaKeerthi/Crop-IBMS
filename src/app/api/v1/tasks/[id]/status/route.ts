import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateTaskStatusInputSchema } from "@/features/tasks/schema";
import { updateTaskStatusHandler } from "@/features/tasks/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const body = await req.json();
    const parsed = UpdateTaskStatusInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    const task = await updateTaskStatusHandler(ctx, id, farmId, parsed.data.status);
    return apiOk(task);
  } catch (err) {
    return apiError(err);
  }
}
