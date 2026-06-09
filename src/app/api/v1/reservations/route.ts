import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import {
  createReservationHandler,
  listReservationsHandler,
} from "@/features/reservations/handlers";
import { CreateReservationInputSchema } from "@/features/reservations/schema";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const yearParam = req.nextUrl.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const reservations = await listReservationsHandler(ctx, farmId, year);
    return apiOk(reservations);
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
    const parsed = CreateReservationInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const reservation = await createReservationHandler(ctx, farmId, parsed.data);
    return apiOk(reservation, 201);
  } catch (err) {
    return apiError(err);
  }
}
