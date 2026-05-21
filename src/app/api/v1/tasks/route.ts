import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateTaskInputSchema } from "@/features/tasks/schema";
import { listTasksHandler, createTaskHandler } from "@/features/tasks/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const filters = {
      status: req.nextUrl.searchParams.get("status") ?? undefined,
      assignedTo: req.nextUrl.searchParams.get("assignedTo") ?? undefined,
      priority: req.nextUrl.searchParams.get("priority") ?? undefined,
    };

    const tasks = await listTasksHandler(ctx, farmId, filters);
    return apiOk(tasks);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const body = await req.json();
    const parsed = CreateTaskInputSchema.safeParse({ ...body, farmId });
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    const task = await createTaskHandler(ctx, farmId, parsed.data);
    return apiOk(task, 201);
  } catch (err) {
    return apiError(err);
  }
}
