import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/response";
import { ApiError } from "@/lib/api/errors";
import { checkFarmAccess } from "@/features/farms/queries";
import { db } from "@/db";
import { activeTimeActivities, activeTimes, activities } from "@/db/schema";

function normalizeActivityName(value: string | null): string {
  return (value ?? "").toLowerCase().replace(/[^a-z]/g, "");
}

function scheduleFieldFromActivity(name: string | null, code: string | null): string | null {
  const fields: Record<string, string> = {
    materialarrival: "materialArrival",
    materialarrivalweek: "materialArrival",
    sowingmale: "sowingMale",
    sowingfemale: "sowingFemale",
    planting: "plantingFemale",
    plantingweek: "plantingFemale",
    plantingfemale: "plantingFemale",
    pollinationstart: "pollinationStart",
    pollinationstartweek: "pollinationStart",
    pollinationend: "pollinationEnd",
    pollinationendweek: "pollinationEnd",
    harvestingstart: "harvestingStart",
    harvestingstartweek: "harvestingStart",
    harvestingend: "harvestingEnd",
    harvestingendweek: "harvestingEnd",
    endweek: "harvestingEnd",
  };
  for (const value of [name, code]) {
    const field = fields[normalizeActivityName(value)];
    if (field) return field;
  }
  return null;
}

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

    const activityRows = await db
      .select({
        name: activities.name,
        code: activities.code,
        weekNumber: activeTimeActivities.weekNumber,
      })
      .from(activeTimeActivities)
      .leftJoin(activities, eq(activeTimeActivities.activityId, activities.id))
      .where(eq(activeTimeActivities.activeTimeId, row.id));

    const activitySchedule: Record<string, number | null> = {};
    for (const activity of activityRows) {
      const field = scheduleFieldFromActivity(activity.name, activity.code);
      if (field && activity.weekNumber != null) {
        activitySchedule[field] = activity.weekNumber;
      }
    }

    return apiOk({
      id: row.id,
      leadTimeRefNumber: row.leadTimeRefNumber,
      materialArrival: row.materialArrival ?? activitySchedule.materialArrival ?? null,
      sowingMale: row.sowingMale ?? activitySchedule.sowingMale ?? null,
      sowingFemale: row.sowingFemale ?? activitySchedule.sowingFemale ?? null,
      plantingMale: row.plantingMale ?? activitySchedule.plantingMale ?? null,
      plantingFemale: row.plantingFemale ?? activitySchedule.plantingFemale ?? null,
      pollinationStart: row.pollinationStart ?? activitySchedule.pollinationStart ?? null,
      pollinationEnd: row.pollinationEnd ?? activitySchedule.pollinationEnd ?? null,
      harvestingStart: row.harvestingStart ?? activitySchedule.harvestingStart ?? null,
      harvestingEnd: row.harvestingEnd ?? activitySchedule.harvestingEnd ?? null,
      leadTimeType: row.leadTimeType,
    });
  } catch (err) {
    return apiError(err);
  }
}
