import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { createTaskFromTemplateHandler } from "@/features/tasks/handlers";
import { checkFarmAccess } from "@/features/farms/queries";
import type { CreateTaskInput } from "@/features/tasks/schema";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { id: templateId } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const body = await req.json().catch(() => ({}));
    const overrides = body as Partial<CreateTaskInput>;

    const task = await createTaskFromTemplateHandler(ctx, templateId, farmId, overrides);
    return apiOk(task, 201);
  } catch (err) {
    return apiError(err);
  }
}
