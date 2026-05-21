import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateTaskTemplateInputSchema } from "@/features/tasks/schema";
import { listTaskTemplatesHandler, createTaskTemplateHandler } from "@/features/tasks/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const templates = await listTaskTemplatesHandler(ctx, farmId);
    return apiOk(templates);
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
    const parsed = CreateTaskTemplateInputSchema.safeParse({ ...body, farmId });
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    const template = await createTaskTemplateHandler(ctx, farmId, parsed.data);
    return apiOk(template, 201);
  } catch (err) {
    return apiError(err);
  }
}
