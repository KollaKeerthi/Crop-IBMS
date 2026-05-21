import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateBlockInputSchema } from "@/features/locations/schema";
import { listBlocksHandler, createBlockHandler } from "@/features/locations/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");

    const parentId = req.nextUrl.searchParams.get("parentId") ?? undefined;
    const parentTypeRaw = req.nextUrl.searchParams.get("parentType");
    const parentType =
      parentTypeRaw === "field" || parentTypeRaw === "greenhouse" ? parentTypeRaw : undefined;

    const result = await listBlocksHandler(ctx, farmId, parentId, parentType);
    return apiOk(result);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = CreateBlockInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const block = await createBlockHandler(ctx, parsed.data);
    return apiOk(block, 201);
  } catch (err) {
    return apiError(err);
  }
}
