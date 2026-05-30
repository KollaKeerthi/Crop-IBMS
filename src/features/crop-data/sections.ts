import type { ZodType } from "zod";
import {
  production,
  pollination,
  postHarvest,
  postHarvestSummary,
  seedsQuality,
  sqBreakdown,
  germinationTest,
} from "@/db/schema";
import {
  UpdateProductionInputSchema,
  UpdatePollinationInputSchema,
  UpdatePostHarvestInputSchema,
  UpdatePostHarvestSummaryInputSchema,
  UpdateSeedsQualityInputSchema,
  UpdateSqBreakdownInputSchema,
  UpdateGerminationTestInputSchema,
  POLLINATION_DATE_FIELDS,
  POST_HARVEST_DATE_FIELDS,
  POST_HARVEST_SUMMARY_DATE_FIELDS,
  SQ_BREAKDOWN_DATE_FIELDS,
  GERMINATION_TEST_DATE_FIELDS,
} from "./schema";

/** A single-record crop-data section backed by its own typed table. */
export type SectionTable =
  | typeof production
  | typeof pollination
  | typeof postHarvest
  | typeof postHarvestSummary
  | typeof seedsQuality
  | typeof sqBreakdown
  | typeof germinationTest;

export type SectionConfig = {
  table: SectionTable;
  schema: ZodType;
  dateFields: readonly string[];
};

/** Registry of generic single-record sections, keyed by URL slug. */
export const SECTION_REGISTRY: Record<string, SectionConfig> = {
  production: {
    table: production,
    schema: UpdateProductionInputSchema,
    dateFields: [],
  },
  pollination: {
    table: pollination,
    schema: UpdatePollinationInputSchema,
    dateFields: POLLINATION_DATE_FIELDS,
  },
  post_harvest: {
    table: postHarvest,
    schema: UpdatePostHarvestInputSchema,
    dateFields: POST_HARVEST_DATE_FIELDS,
  },
  post_harvest_summary: {
    table: postHarvestSummary,
    schema: UpdatePostHarvestSummaryInputSchema,
    dateFields: POST_HARVEST_SUMMARY_DATE_FIELDS,
  },
  seeds_quality: {
    table: seedsQuality,
    schema: UpdateSeedsQualityInputSchema,
    dateFields: [],
  },
  sq_breakdown: {
    table: sqBreakdown,
    schema: UpdateSqBreakdownInputSchema,
    dateFields: SQ_BREAKDOWN_DATE_FIELDS,
  },
  germination_test: {
    table: germinationTest,
    schema: UpdateGerminationTestInputSchema,
    dateFields: GERMINATION_TEST_DATE_FIELDS,
  },
};

export function getSectionConfig(section: string): SectionConfig | null {
  return SECTION_REGISTRY[section] ?? null;
}

export const SECTION_KEYS = Object.keys(SECTION_REGISTRY);
