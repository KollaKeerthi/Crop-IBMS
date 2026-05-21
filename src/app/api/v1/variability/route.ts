import { type NextRequest } from "next/server";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { requireAuth } from "@/lib/api/auth";
import { CreateVariabilityInputSchema } from "@/features/variability/schema";
import {
  listVariabilityHandler,
  createVariabilityHandler,
} from "@/features/variability/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    return apiOk(await listVariabilityHandler(ctx, farmId));
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json().catch(() => null);
    if (!body) throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
    const parsed = CreateVariabilityInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "validation_error", firstError(parsed.error.issues, "Invalid input."));
    }
    return apiOk(await createVariabilityHandler(ctx, parsed.data), 201);
  } catch (err) {
    return apiError(err);
  }
}
