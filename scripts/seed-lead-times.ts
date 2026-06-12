#!/usr/bin/env bun
/**
 * Seeds standard lead times for a given farm.
 * Usage: bun scripts/seed-lead-times.ts --farmId <uuid>
 *
 * Requires crops (Cucumber, Tomato), varieties (BAT, LET, MID, IGCHP, IUCHP),
 * seasons with names containing "summer"/"winter", and a production type with code "LP"
 * to already exist for the farm.
 */
import { eq, ilike, and } from "drizzle-orm";
import { db } from "../src/db";
import { activeTimes, crops, cropVarieties, seasons, productionTypes } from "../src/db/schema";

const args = process.argv.slice(2);
const farmIdIdx = args.indexOf("--farmId");
const farmId = farmIdIdx !== -1 ? args[farmIdIdx + 1] : undefined;

if (!farmId) {
  console.error("Usage: bun scripts/seed-lead-times.ts --farmId <uuid>");
  process.exit(1);
}
const targetFarmId = farmId;

type SeedRow = {
  refNo: string;
  leadTimeType: "Reservation" | "Contract";
  productionTypeCode: string;
  cropName: string;
  varietyName: string | null;
  seasonName: string;
  materialArrival: number;
  sowingMale: number;
  sowingFemale: number;
  plantingMale: number;
  plantingFemale: number;
  pollinationStart: number;
  pollinationEnd: number;
  harvestingStart: number;
  harvestingEnd: number;
};

const SEED_DATA: SeedRow[] = [
  {
    refNo: "CLT-1",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: "BAT",
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 2,
    plantingMale: 2,
    plantingFemale: 4,
    pollinationStart: 7,
    pollinationEnd: 9,
    harvestingStart: 15,
    harvestingEnd: 16,
  },
  {
    refNo: "CLT-2",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: "BAT",
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 2,
    plantingMale: 2,
    plantingFemale: 4,
    pollinationStart: 7,
    pollinationEnd: 9,
    harvestingStart: 15,
    harvestingEnd: 16,
  },
  {
    refNo: "CLT-7",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: "LET",
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 2,
    plantingMale: 2,
    plantingFemale: 4,
    pollinationStart: 7,
    pollinationEnd: 9,
    harvestingStart: 15,
    harvestingEnd: 16,
  },
  {
    refNo: "CLT-8",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: "LET",
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 3,
    plantingMale: 3,
    plantingFemale: 5,
    pollinationStart: 8,
    pollinationEnd: 10,
    harvestingStart: 17,
    harvestingEnd: 19,
  },
  {
    refNo: "CLT-9",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: "MID",
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 2,
    plantingMale: 2,
    plantingFemale: 4,
    pollinationStart: 7,
    pollinationEnd: 9,
    harvestingStart: 15,
    harvestingEnd: 16,
  },
  {
    refNo: "CLT-10",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: "MID",
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 3,
    plantingMale: 3,
    plantingFemale: 5,
    pollinationStart: 8,
    pollinationEnd: 10,
    harvestingStart: 16,
    harvestingEnd: 18,
  },
  {
    refNo: "RLT-2",
    leadTimeType: "Reservation",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: null,
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 3,
    plantingMale: 3,
    plantingFemale: 5,
    pollinationStart: 8,
    pollinationEnd: 10,
    harvestingStart: 16,
    harvestingEnd: 18,
  },
  {
    refNo: "RLT-1",
    leadTimeType: "Reservation",
    productionTypeCode: "LP",
    cropName: "Cucumber",
    varietyName: null,
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 2,
    plantingMale: 2,
    plantingFemale: 4,
    pollinationStart: 7,
    pollinationEnd: 9,
    harvestingStart: 14,
    harvestingEnd: 16,
  },
  {
    refNo: "RLT-21",
    leadTimeType: "Reservation",
    productionTypeCode: "LP",
    cropName: "Tomato",
    varietyName: null,
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 5,
    plantingMale: 5,
    plantingFemale: 9,
    pollinationStart: 11,
    pollinationEnd: 27,
    harvestingStart: 19,
    harvestingEnd: 34,
  },
  {
    refNo: "RLT-22",
    leadTimeType: "Reservation",
    productionTypeCode: "LP",
    cropName: "Tomato",
    varietyName: null,
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 5,
    plantingMale: 6,
    plantingFemale: 10,
    pollinationStart: 12,
    pollinationEnd: 28,
    harvestingStart: 20,
    harvestingEnd: 36,
  },
  {
    refNo: "CLT-280",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Tomato",
    varietyName: "IGCHP",
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 5,
    plantingMale: 5,
    plantingFemale: 9,
    pollinationStart: 11,
    pollinationEnd: 27,
    harvestingStart: 19,
    harvestingEnd: 34,
  },
  {
    refNo: "CLT-281",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Tomato",
    varietyName: "IGCHP",
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 5,
    plantingMale: 6,
    plantingFemale: 10,
    pollinationStart: 12,
    pollinationEnd: 28,
    harvestingStart: 20,
    harvestingEnd: 36,
  },
  {
    refNo: "CLT-282",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Tomato",
    varietyName: "IUCHP",
    seasonName: "summer",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 5,
    plantingMale: 5,
    plantingFemale: 9,
    pollinationStart: 11,
    pollinationEnd: 27,
    harvestingStart: 19,
    harvestingEnd: 34,
  },
  {
    refNo: "CLT-283",
    leadTimeType: "Contract",
    productionTypeCode: "LP",
    cropName: "Tomato",
    varietyName: "IUCHP",
    seasonName: "winter",
    materialArrival: 0,
    sowingMale: 1,
    sowingFemale: 5,
    plantingMale: 6,
    plantingFemale: 10,
    pollinationStart: 12,
    pollinationEnd: 28,
    harvestingStart: 20,
    harvestingEnd: 36,
  },
];

async function main() {
  console.log(`Seeding lead times for farm: ${farmId}\n`);

  // Look up production type LP
  const [lpType] = await db.select().from(productionTypes).where(eq(productionTypes.code, "LP"));
  if (!lpType) {
    console.error('Production type "LP" not found. Create it first.');
    process.exit(1);
  }

  // Look up crops
  const cropRows = await db.select().from(crops);
  const cropByName = new Map(cropRows.map((c) => [c.name.toLowerCase(), c]));

  // Look up crop varieties
  const varietyRows = await db.select().from(cropVarieties);

  // Look up seasons for this farm
  const seasonRows = await db.select().from(seasons).where(eq(seasons.farmId, targetFarmId));
  const seasonByKeyword = new Map<string, string>();
  for (const s of seasonRows) {
    const nameLower = s.name.toLowerCase();
    if (nameLower.includes("summer") && !seasonByKeyword.has("summer")) {
      seasonByKeyword.set("summer", s.id);
    }
    if (nameLower.includes("winter") && !seasonByKeyword.has("winter")) {
      seasonByKeyword.set("winter", s.id);
    }
  }

  let inserted = 0;
  let skipped = 0;

  for (const row of SEED_DATA) {
    const crop = cropByName.get(row.cropName.toLowerCase());
    if (!crop) {
      console.warn(`  SKIP ${row.refNo}: crop "${row.cropName}" not found`);
      skipped++;
      continue;
    }

    let varietyId: string | null = null;
    if (row.varietyName) {
      const variety = varietyRows.find(
        (v) => v.cropId === crop.id && v.name.toLowerCase() === row.varietyName!.toLowerCase()
      );
      if (!variety) {
        console.warn(
          `  SKIP ${row.refNo}: variety "${row.varietyName}" not found for ${row.cropName}`
        );
        skipped++;
        continue;
      }
      varietyId = variety.id;
    }

    const seasonId = seasonByKeyword.get(row.seasonName) ?? null;
    if (!seasonId) {
      console.warn(
        `  SKIP ${row.refNo}: no season containing "${row.seasonName}" found for this farm`
      );
      skipped++;
      continue;
    }

    await db.insert(activeTimes).values({
      farmId: targetFarmId,
      leadTimeRefNumber: row.refNo,
      leadTimeType: row.leadTimeType,
      productionTypeId: lpType.id,
      cropId: crop.id,
      varietyId,
      seasonId,
      materialArrival: row.materialArrival,
      sowingMale: row.sowingMale,
      sowingFemale: row.sowingFemale,
      plantingMale: row.plantingMale,
      plantingFemale: row.plantingFemale,
      pollinationStart: row.pollinationStart,
      pollinationEnd: row.pollinationEnd,
      harvestingStart: row.harvestingStart,
      harvestingEnd: row.harvestingEnd,
      isActive: true,
    });

    console.log(
      `  OK  ${row.refNo} — ${row.leadTimeType} / ${row.cropName} ${row.varietyName ?? "--"} / ${row.seasonName}`
    );
    inserted++;
  }

  console.log(`\nDone: ${inserted} inserted, ${skipped} skipped.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
