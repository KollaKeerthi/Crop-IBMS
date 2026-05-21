import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { UpdateProductionSiteInputSchema } from "@/features/production-sites/schema";
import {
  getProductionSiteHandler,
  updateProductionSiteHandler,
  deleteProductionSiteHandler,
} from "@/features/production-sites/handlers";

type Params = { params: Promise<{ siteId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { siteId } = await params;
    const site = await getProductionSiteHandler(ctx, siteId);
    return apiOk(site);
  } catch (err) {
    return apiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { siteId } = await params;
    const body = await req.json();
    const parsed = UpdateProductionSiteInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const site = await updateProductionSiteHandler(ctx, siteId, parsed.data);
    return apiOk(site);
  } catch (err) {
    return apiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const ctx = await requireAuth();
    const { siteId } = await params;
    await deleteProductionSiteHandler(ctx, siteId);
    return apiOk(null, 204);
  } catch (err) {
    return apiError(err);
  }
}
