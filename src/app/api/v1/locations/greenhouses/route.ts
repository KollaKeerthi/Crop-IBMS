import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateGreenhouseInputSchema } from "@/features/locations/schema";
import { listGreenhousesHandler, createGreenhouseHandler } from "@/features/locations/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    const result = await listGreenhousesHandler(ctx, farmId);
    return apiOk(result);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = CreateGreenhouseInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const greenhouse = await createGreenhouseHandler(ctx, parsed.data);
    return apiOk(greenhouse, 201);
  } catch (err) {
    return apiError(err);
  }
}
