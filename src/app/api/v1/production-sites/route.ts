import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { apiOk, apiError, firstError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { CreateProductionSiteInputSchema } from "@/features/production-sites/schema";
import {
  listProductionSitesHandler,
  createProductionSiteHandler,
} from "@/features/production-sites/handlers";

export async function GET() {
  try {
    const ctx = await requireAuth();
    const sites = await listProductionSitesHandler(ctx);
    return apiOk(sites);
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const body = await req.json();
    const parsed = CreateProductionSiteInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(422, "validation_error", firstError(parsed.error.issues, "Invalid input"));
    }
    const site = await createProductionSiteHandler(ctx, parsed.data);
    return apiOk(site, 201);
  } catch (err) {
    return apiError(err);
  }
}
