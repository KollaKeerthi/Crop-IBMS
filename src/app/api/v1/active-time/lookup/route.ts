import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import { db } from "@/db";
import { activeTimes } from "@/db/schema";

export async function GET(req: NextRequest) {
  try {
    const ctx = await requireAuth();
    const p = req.nextUrl.searchParams;
    const farmId = p.get("farmId");
    const cropId = p.get("cropId");
    const productionTypeId = p.get("productionTypeId");
    const leadTimeType = p.get("leadTimeType");

    if (!farmId) throw new ApiError(400, "bad_request", "farmId is required.");
    const hasAccess = await checkFarmAccess(farmId, ctx.userId);
    if (!hasAccess) throw new ApiError(403, "forbidden", "Access denied.");

    const seasonId = p.get("seasonId");

    const conditions = [eq(activeTimes.farmId, farmId), eq(activeTimes.isActive, true)];
    if (cropId) conditions.push(eq(activeTimes.cropId, cropId));
    if (productionTypeId) conditions.push(eq(activeTimes.productionTypeId, productionTypeId));
    if (seasonId) conditions.push(eq(activeTimes.seasonId, seasonId));
    if (leadTimeType) conditions.push(eq(activeTimes.leadTimeType, leadTimeType));

    const [row] = await db
      .select()
      .from(activeTimes)
      .where(and(...conditions))
      .limit(1);

    if (!row) return apiOk(null);

    return apiOk({
      id: row.id,
      leadTimeRefNumber: row.leadTimeRefNumber,
      materialArrival: row.materialArrival,
      sowingMale: row.sowingMale,
      sowingFemale: row.sowingFemale,
      plantingMale: row.plantingMale,
      plantingFemale: row.plantingFemale,
      pollinationStart: row.pollinationStart,
      pollinationEnd: row.pollinationEnd,
      harvestingStart: row.harvestingStart,
      harvestingEnd: row.harvestingEnd,
      leadTimeType: row.leadTimeType,
    });
  } catch (err) {
    return apiError(err);
  }
}
