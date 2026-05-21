import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateBlockMasterInputSchema } from "@/features/block-master/schema";
import { getBlockHandler, updateBlockHandler, deleteBlockHandler } from "@/features/block-master/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

type Params = { params: Promise<{ blockId: string }> };

async function resolveFarmId(req: NextRequest): Promise<string> {
  const farmId = req.nextUrl.searchParams.get("farmId");
  if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
  return farmId;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { blockId } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const block = await getBlockHandler(ctx, blockId, farmId);
    return apiOk(block);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { blockId } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const body = await req.json();
    const parsed = UpdateBlockMasterInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const block = await updateBlockHandler(ctx, blockId, farmId, parsed.data);
    return apiOk(block);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { blockId } = await params;
    const farmId = await resolveFarmId(req);
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    await deleteBlockHandler(ctx, blockId, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
