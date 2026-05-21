import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateSubBlockInputSchema } from "@/features/sub-blocks/schema";
import { listSubBlocksHandler, createSubBlockHandler } from "@/features/sub-blocks/handlers";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const blockId = req.nextUrl.searchParams.get("blockId");
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!blockId) throw new ApiError(400, "bad_request", "blockId is required.");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const items = await listSubBlocksHandler(ctx, farmId, blockId);
    return apiOk(items);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = CreateSubBlockInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const subBlock = await createSubBlockHandler(ctx, parsed.data);
    return apiOk(subBlock, 201);
  } catch (err) {
    return apiError(err);
  }
}
