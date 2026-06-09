import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import {
  deleteReservationHandler,
  getReservationHandler,
  updateReservationHandler,
} from "@/features/reservations/handlers";
import { UpdateReservationInputSchema } from "@/features/reservations/schema";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const reservation = await getReservationHandler(ctx, id, farmId);
    return apiOk(reservation);
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
    const parsed = UpdateReservationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const reservation = await updateReservationHandler(ctx, id, farmId, parsed.data);
    return apiOk(reservation);
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
    await deleteReservationHandler(ctx, id, farmId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
