import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import { allocateContractHandler } from "@/features/contracts/handlers";
import { AllocateContractInputSchema } from "@/features/contracts/schema";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireAuth();
    const { id } = await params;
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const body = await req.json();
    const parsed = AllocateContractInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const contract = await allocateContractHandler(ctx, id, farmId, parsed.data);
    return apiOk(contract);
  } catch (err) {
    return apiError(err);
  }
}
