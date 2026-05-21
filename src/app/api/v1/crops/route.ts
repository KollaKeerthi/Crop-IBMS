import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateCropInputSchema } from "@/features/crops/schema";
import { listCropsHandler, createCropHandler } from "@/features/crops/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const search = req.nextUrl.searchParams.get("search") ?? undefined;
    const crops = await listCropsHandler(ctx, search);
    return apiOk(crops);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = CreateCropInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const crop = await createCropHandler(ctx, parsed.data);
    return apiOk(crop, 201);
  } catch (err) {
    return apiError(err);
  }
}
