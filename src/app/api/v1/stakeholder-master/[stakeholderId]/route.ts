import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateStakeholderInputSchema } from "@/features/stakeholder-master/schema";
import {
  getStakeholderHandler,
  updateStakeholderHandler,
  deleteStakeholderHandler,
} from "@/features/stakeholder-master/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ stakeholderId: string }> };

async function resolveFarmId(req: NextRequest): Promise<string> {
  const farmId = req.nextUrl.searchParams.get("farmId");
  if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
  return farmId;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { stakeholderId } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const stakeholder = await getStakeholderHandler(ctx, stakeholderId, farmId);
    return apiOk(stakeholder);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { stakeholderId } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const body = await req.json();
    const parsed = UpdateStakeholderInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const stakeholder = await updateStakeholderHandler(ctx, stakeholderId, farmId, parsed.data);
    return apiOk(stakeholder);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { stakeholderId } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    await deleteStakeholderHandler(ctx, stakeholderId, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
