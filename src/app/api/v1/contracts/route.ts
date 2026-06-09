import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import { createContractHandler, listContractsHandler } from "@/features/contracts/handlers";
import { CreateContractInputSchema } from "@/features/contracts/schema";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const farmId = req.nextUrl.searchParams.get("farmId");
    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");
    const yearParam = req.nextUrl.searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    const contracts = await listContractsHandler(ctx, farmId, year);
    return apiOk(contracts);
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
    const parsed = CreateContractInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const contract = await createContractHandler(ctx, farmId, parsed.data);
    return apiOk(contract, 201);
  } catch (err) {
    return apiError(err);
  }
}
