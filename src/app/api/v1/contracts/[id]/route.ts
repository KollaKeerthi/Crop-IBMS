import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import {
  deleteContractHandler,
  getContractHandler,
  updateContractHandler,
} from "@/features/contracts/handlers";
import { UpdateContractInputSchema } from "@/features/contracts/schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const contract = await getContractHandler(ctx, id, farmId);
    return apiOk(contract);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const body = await req.json();
    const parsed = UpdateContractInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const contract = await updateContractHandler(ctx, id, farmId, parsed.data);
    return apiOk(contract);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    await deleteContractHandler(ctx, id, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
