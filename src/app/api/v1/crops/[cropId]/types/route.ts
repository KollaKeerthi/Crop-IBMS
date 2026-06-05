import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateCropTypeInputSchema } from "@/features/crops/schema";
import { createCropTypeHandler } from "@/features/crops/handlers";

type Params = { params: Promise<{ cropId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { cropId } = await params;
    const body = await req.json();
    const parsed = CreateCropTypeInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const type = await createCropTypeHandler(ctx, cropId, parsed.data);
    return apiOk(type, 201);
  } catch (err) {
    return apiError(err);
  }
}
