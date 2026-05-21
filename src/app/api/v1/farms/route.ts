import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateFarmInputSchema } from "@/features/farms/schema";
import { listFarmsHandler, createFarmHandler } from "@/features/farms/handlers";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const farms = await listFarmsHandler(ctx);
    return apiOk(farms);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = CreateFarmInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        422,
        "validation_error",
        firstError(parsed.error.issues, "Invalid input")
      );
    }
    const farm = await createFarmHandler(ctx, parsed.data);
    return apiOk(farm, 201);
  } catch (err) {
    return apiError(err);
  }
}
