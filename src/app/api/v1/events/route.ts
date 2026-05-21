import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateEventInputSchema } from "@/features/events/schema";
import { listEventsHandler, createEventHandler } from "@/features/events/handlers";
import { checkFarmAccess } from "@/features/farms/queries";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const fromStr = req.nextUrl.searchParams.get("from");
    const toStr = req.nextUrl.searchParams.get("to");
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    const events = await listEventsHandler(ctx, farmId, from, to);
    return apiOk(events);
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
    const parsed = CreateEventInputSchema.safeParse({ ...body, farmId });
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }

    const event = await createEventHandler(ctx, farmId, parsed.data);
    return apiOk(event, 201);
  } catch (err) {
    return apiError(err);
  }
}
