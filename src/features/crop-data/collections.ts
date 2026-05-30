import type { ZodType } from "zod";
import { harvestRecords, performancePerPerson } from "@/db/schema";
import {
  HarvestRecordInputSchema,
  PerformanceInputSchema,
  HARVEST_RECORD_DATE_FIELDS,
  PERFORMANCE_DATE_FIELDS,
} from "./schema";

/** A multi-row crop-data collection backed by its own typed table. */
export type CollectionTable = typeof harvestRecords | typeof performancePerPerson;

export type CollectionConfig = {
  table: CollectionTable;
  schema: ZodType;
  dateFields: readonly string[];
  /** Column to order rows by (most-recent first). */
  orderColumn: "createdAt";
};

export const COLLECTION_REGISTRY: Record<string, CollectionConfig> = {
  harvest_records: {
    table: harvestRecords,
    schema: HarvestRecordInputSchema,
    dateFields: HARVEST_RECORD_DATE_FIELDS,
    orderColumn: "createdAt",
  },
  performance: {
    table: performancePerPerson,
    schema: PerformanceInputSchema,
    dateFields: PERFORMANCE_DATE_FIELDS,
    orderColumn: "createdAt",
  },
};

export function getCollectionConfig(collection: string): CollectionConfig | null {
  return COLLECTION_REGISTRY[collection] ?? null;
}

export const COLLECTION_KEYS = Object.keys(COLLECTION_REGISTRY);
