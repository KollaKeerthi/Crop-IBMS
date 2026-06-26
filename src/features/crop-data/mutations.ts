import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  cropData,
  programInfo,
  nursery,
  revenue,
  cropDataModules,
  cropDataAllocationSegments,
  mediaAttachments,
  production,
  postHarvest,
} from "@/db/schema";
import {
  PROGRAM_INFO_DATE_FIELDS,
  NURSERY_DATE_FIELDS,
  type CreateCropDataInput,
  type UpdateCropDataInput,
  type UpdateProgramInfoInput,
  type UpdateNurseryInput,
  type UpdateRevenueInput,
} from "./schema";
import type { SectionTable } from "./sections";
import type { CollectionTable } from "./collections";
import {
  computeProgramInfoDerivedFields,
  computeNurseryDerivedFields,
  computeProductionDerivedFields,
  postHarvestComputations,
} from "./compute";

// Coerce the listed ISO-string date fields to Date | null. Empty string / null
// become null; everything else is parsed into a Date. Non-listed fields pass through.
function coerceDates<T extends Record<string, unknown>>(
  input: T,
  dateFields: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input };
  for (const key of dateFields) {
    if (key in out) {
      const v = out[key];
      out[key] = v === "" || v === null || v === undefined ? null : new Date(v as string);
    }
  }
  return out;
}

export async function createCropDataRecord(input: CreateCropDataInput) {
  const rows = await db.insert(cropData).values(input).returning();
  return rows[0]!;
}

export async function updateCropDataRecord(id: string, input: UpdateCropDataInput) {
  const rows = await db
    .update(cropData)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(cropData.id, id))
    .returning();
  return rows[0] ?? null;
}

export async function deleteCropDataRecord(id: string) {
  await db.delete(cropData).where(eq(cropData.id, id));
}

export async function upsertProgramInfo(cropDataId: string, input: UpdateProgramInfoInput) {
  const computed = computeProgramInfoDerivedFields(input) as UpdateProgramInfoInput;
  const dbInput = coerceDates(computed, PROGRAM_INFO_DATE_FIELDS);
  const existing = await db
    .select()
    .from(programInfo)
    .where(eq(programInfo.cropDataId, cropDataId))
    .limit(1);

  if (existing[0]) {
    const rows = await db
      .update(programInfo)
      .set({ ...dbInput, updatedAt: new Date() })
      .where(eq(programInfo.cropDataId, cropDataId))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(programInfo)
    .values({ cropDataId, ...dbInput })
    .returning();
  return rows[0]!;
}

export async function upsertRevenue(cropDataId: string, input: UpdateRevenueInput) {
  const existing = await db
    .select()
    .from(revenue)
    .where(eq(revenue.cropDataId, cropDataId))
    .limit(1);

  if (existing[0]) {
    const rows = await db
      .update(revenue)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(revenue.cropDataId, cropDataId))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(revenue)
    .values({ cropDataId, ...input })
    .returning();
  return rows[0]!;
}

export async function upsertNursery(cropDataId: string, input: UpdateNurseryInput) {
  const prog = await db
    .select()
    .from(programInfo)
    .where(eq(programInfo.cropDataId, cropDataId))
    .limit(1);
  const progInfo = prog[0] ?? null;
  const computed = computeNurseryDerivedFields(input, progInfo) as UpdateNurseryInput;
  const dbInput = coerceDates(computed, NURSERY_DATE_FIELDS);
  const existing = await db
    .select()
    .from(nursery)
    .where(eq(nursery.cropDataId, cropDataId))
    .limit(1);

  if (existing[0]) {
    const rows = await db
      .update(nursery)
      .set({ ...dbInput, updatedAt: new Date() })
      .where(eq(nursery.cropDataId, cropDataId))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(nursery)
    .values({ cropDataId, ...dbInput })
    .returning();
  return rows[0]!;
}

// Generic upsert for single-record typed sections (production, pollination, …).
// Date coercion is applied for the section's declared date fields.
export async function upsertSectionRow(
  table: SectionTable,
  cropDataId: string,
  input: Record<string, unknown>,
  dateFields: readonly string[]
) {
  let finalInput = input;
  if (table === production) {
    const prog = await db
      .select()
      .from(programInfo)
      .where(eq(programInfo.cropDataId, cropDataId))
      .limit(1);
    const nurs = await db.select().from(nursery).where(eq(nursery.cropDataId, cropDataId)).limit(1);
    finalInput = computeProductionDerivedFields(input, nurs[0] ?? null, prog[0] ?? null);
  } else if (table === postHarvest) {
    const prog = await db
      .select()
      .from(programInfo)
      .where(eq(programInfo.cropDataId, cropDataId))
      .limit(1);
    const prod = await db
      .select()
      .from(production)
      .where(eq(production.cropDataId, cropDataId))
      .limit(1);
    const nurs = await db.select().from(nursery).where(eq(nursery.cropDataId, cropDataId)).limit(1);

    const ctx = {
      ...(prog[0] ?? {}),
      ...(prod[0] ?? {}),
      ...(nurs[0] ?? {}),
    };
    const computed = postHarvestComputations(input, ctx);
    finalInput = {
      ...input,
      netCropCycleWeeks: computed.netWeeks,
    };
  }
  const values = coerceDates(finalInput, dateFields);
  const existing = await db.select().from(table).where(eq(table.cropDataId, cropDataId)).limit(1);

  if (existing[0]) {
    const rows = await db
      .update(table)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(table.cropDataId, cropDataId))
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(table)
    .values({ cropDataId, ...values })
    .returning();
  return rows[0]!;
}

// Multi-row collection CRUD (harvest records, performance). Row mutations are
// always scoped by (rowId AND cropDataId) so a row can't be touched cross-record.
export async function insertCollectionRow(
  table: CollectionTable,
  cropDataId: string,
  input: Record<string, unknown>,
  dateFields: readonly string[]
) {
  const values = coerceDates(input, dateFields);
  const rows = await db
    .insert(table)
    .values({ cropDataId, ...values })
    .returning();
  return rows[0]!;
}

export async function updateCollectionRow(
  table: CollectionTable,
  cropDataId: string,
  rowId: string,
  input: Record<string, unknown>,
  dateFields: readonly string[]
) {
  const values = coerceDates(input, dateFields);
  const rows = await db
    .update(table)
    .set(values)
    .where(and(eq(table.id, rowId), eq(table.cropDataId, cropDataId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteCollectionRow(
  table: CollectionTable,
  cropDataId: string,
  rowId: string
) {
  await db.delete(table).where(and(eq(table.id, rowId), eq(table.cropDataId, cropDataId)));
}

export async function insertMedia(values: {
  entityId: string;
  url: string;
  cloudinaryId?: string | null;
  teedyDocumentId?: string | null;
  teedyFileId?: string | null;
  name?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedBy?: string | null;
}) {
  const rows = await db
    .insert(mediaAttachments)
    .values({ entityType: "crop_data", ...values })
    .returning();
  return rows[0]!;
}

export async function deleteMedia(id: string, cropDataId: string) {
  await db
    .delete(mediaAttachments)
    .where(
      and(
        eq(mediaAttachments.id, id),
        eq(mediaAttachments.entityType, "crop_data"),
        eq(mediaAttachments.entityId, cropDataId)
      )
    );
}

export async function upsertModule(
  cropDataId: string,
  moduleType: string,
  data: Record<string, unknown>
) {
  const existing = await db
    .select()
    .from(cropDataModules)
    .where(
      and(eq(cropDataModules.cropDataId, cropDataId), eq(cropDataModules.moduleType, moduleType))
    )
    .limit(1);

  if (existing[0]) {
    const rows = await db
      .update(cropDataModules)
      .set({ data, updatedAt: new Date() })
      .where(
        and(eq(cropDataModules.cropDataId, cropDataId), eq(cropDataModules.moduleType, moduleType))
      )
      .returning();
    return rows[0]!;
  }

  const rows = await db
    .insert(cropDataModules)
    .values({ cropDataId, moduleType, data })
    .returning();
  return rows[0]!;
}

export type AllocationSegmentInput = {
  cropDataId: string;
  contractLineId: string | null;
  blockMasterId: string | null;
  cropId: string | null;
  varietyId: string | null;
  rowNo: number;
  gender: string;
  plantCount: number;
  startPlantNo: number;
  endPlantNo: number;
  sequence: number;
  periodYear: number | null;
  periodStartWeek: number | null;
  periodEndWeek: number | null;
  userId: string;
};

export async function replaceAllocationSegments(
  cropDataId: string,
  segments: AllocationSegmentInput[]
) {
  await db
    .delete(cropDataAllocationSegments)
    .where(eq(cropDataAllocationSegments.cropDataId, cropDataId));

  if (segments.length === 0) return [];

  const rows = await db
    .insert(cropDataAllocationSegments)
    .values(
      segments.map((segment) => ({
        cropDataId: segment.cropDataId,
        contractLineId: segment.contractLineId,
        blockMasterId: segment.blockMasterId,
        cropId: segment.cropId,
        varietyId: segment.varietyId,
        rowNo: segment.rowNo,
        gender: segment.gender,
        plantCount: segment.plantCount,
        startPlantNo: segment.startPlantNo,
        endPlantNo: segment.endPlantNo,
        sequence: segment.sequence,
        periodYear: segment.periodYear,
        periodStartWeek: segment.periodStartWeek,
        periodEndWeek: segment.periodEndWeek,
        createdBy: segment.userId,
        updatedBy: segment.userId,
      }))
    )
    .returning();

  return rows;
}
