"use client";

import { useMemo } from "react";
import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import {
  UpdateProductionInputSchema,
  UpdatePollinationInputSchema,
  UpdatePostHarvestInputSchema,
  UpdatePostHarvestSummaryInputSchema,
  POLLINATION_DATE_FIELDS,
  POST_HARVEST_DATE_FIELDS,
  POST_HARVEST_SUMMARY_DATE_FIELDS,
} from "../schema";
import { useUpdateSection } from "../hooks";
import {
  fmtNum,
  pollinationEstimatedYield,
  postHarvestComputations,
  computeProductionDerivedFields,
} from "../compute";

type BaseProps = {
  cropDataId: string;
  farmId: string;
  initial: Vals | null;
};

// ---- Production ----
const PRODUCTION_ROWS: MetricRow[] = [
  { kind: "single", label: "Realized No. of Plants", type: "int", name: "realizedPlants" },
  { kind: "single", label: "Realized No. of Rows", type: "int", name: "realizedRows" },
  { kind: "single", label: "Realized Surface Area", type: "number", name: "realizedSurfaceArea" },
  { kind: "single", label: "Realized Plants / m2", type: "number", name: "realizedPlantsPerSqm" },
  { kind: "single", label: "Avg Temperature", type: "number", name: "avgTemperature" },
  { kind: "single", label: "Avg Radiation", type: "number", name: "avgRadiation" },
  { kind: "single", label: "Avg Humidity", type: "number", name: "avgHumidity" },
  { kind: "single", label: "Remarks", type: "textarea", name: "remarks" },
  { kind: "single", label: "Recommendations", type: "textarea", name: "recommendations" },
];

export function ProductionForm({
  cropDataId,
  farmId,
  initial,
  nursery,
  programInfo,
}: BaseProps & { nursery: Vals | null; programInfo: Vals | null }) {
  const mutation = useUpdateSection(cropDataId, farmId, "production");

  const mergedInitial = useMemo(() => {
    const computed = computeProductionDerivedFields(initial ?? {}, nursery, programInfo);
    return { ...initial, ...computed };
  }, [initial, nursery, programInfo]);

  return (
    <MetricForm
      title="Production"
      rows={PRODUCTION_ROWS}
      initial={mergedInitial}
      schema={UpdateProductionInputSchema}
      showGenderColumns={false}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
      onValuesChange={(vals) => computeProductionDerivedFields(vals, nursery, programInfo) as Vals}
    />
  );
}

// ---- Pollination ----
const POLLINATION_ROWS: MetricRow[] = [
  { kind: "single", label: "Pollination Start", type: "date", name: "pollinationStart" },
  { kind: "single", label: "Pollination End", type: "date", name: "pollinationEnd" },
  { kind: "single", label: "Supervisor in charge", type: "text", name: "supervisor" },
  { kind: "single", label: "Avg. Seeds / Fruit", type: "number", name: "avgSeedsPerFruit" },
  { kind: "single", label: "Fruits / Plant", type: "number", name: "fruitsPerPlant" },
  { kind: "single", label: "No. of Seeds per Gram", type: "number", name: "seedsPerGram" },
  { kind: "single", label: "Expected Harvest Date", type: "date", name: "expectedHarvestDate" },
  {
    kind: "computed",
    label: "Estimated Yield (kg)",
    compute: (v, ctx) => fmtNum(pollinationEstimatedYield(v, ctx)),
  },
  {
    kind: "single",
    label: "Avg. Temp During Pollination",
    type: "number",
    name: "avgTempDuringPollination",
  },
  {
    kind: "single",
    label: "Light in J/cm² During Pollination",
    type: "number",
    name: "lightDuringPollination",
  },
  {
    kind: "single",
    label: "Avg Humidity During Pollination",
    type: "number",
    name: "avgHumidityDuringPollination",
  },
  { kind: "single", label: "Remarks", type: "textarea", name: "remarks" },
  { kind: "single", label: "Recommendations", type: "textarea", name: "recommendations" },
];

export function PollinationForm({
  cropDataId,
  farmId,
  initial,
  production,
}: BaseProps & { production: Vals | null }) {
  const mutation = useUpdateSection(cropDataId, farmId, "pollination");
  return (
    <MetricForm
      title="Pollination"
      rows={POLLINATION_ROWS}
      initial={initial}
      schema={UpdatePollinationInputSchema}
      dateFields={POLLINATION_DATE_FIELDS}
      computeContext={production ?? {}}
      showGenderColumns={false}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
    />
  );
}

// ---- Post Harvest ----
const POST_HARVEST_ROWS: MetricRow[] = [
  { kind: "single", label: "Harvest Start Date", type: "date", name: "harvestStartDate" },
  { kind: "single", label: "Harvest End Date", type: "int", name: "harvestEndDate" },
  { kind: "single", label: "Planned Shipping Date", type: "date", name: "plannedShippingDate" },
  { kind: "single", label: "Actual Shipping Date", type: "date", name: "actualShippingDate" },
  { kind: "single", label: "Total No. of Harvests", type: "int", name: "totalNoOfHarvests" },
  { kind: "single", label: "Total KGs", type: "number", name: "totalKgs" },
  {
    kind: "computed",
    label: "Actual Yield (%)",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).actualYieldPct, 8),
  },
  {
    kind: "computed",
    label: "Grams per m2",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).gramsPerSqm, 8),
  },
  {
    kind: "computed",
    label: "Grams per Plant",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).gramsPerPlant, 8),
  },
  {
    kind: "computed",
    label: "Net Crop Cycle Weeks",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).netWeeks, 0),
  },
  {
    kind: "computed",
    label: "Actual Gr/m2/wk",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).actualGrPerSqmWk, 9),
  },
  { kind: "single", label: "% Germination", type: "number", name: "germinationPct", suffix: "%" },
  { kind: "single", label: "Remarks", type: "textarea", name: "remarks" },
  { kind: "single", label: "Recommendations", type: "textarea", name: "recommendations" },
];

export function PostHarvestForm({
  cropDataId,
  farmId,
  initial,
  context,
}: BaseProps & { context: Vals | null }) {
  const mutation = useUpdateSection(cropDataId, farmId, "post_harvest");
  return (
    <MetricForm
      title="Post Harvest"
      rows={POST_HARVEST_ROWS}
      initial={initial}
      schema={UpdatePostHarvestInputSchema}
      dateFields={POST_HARVEST_DATE_FIELDS}
      computeContext={context ?? {}}
      showGenderColumns={false}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
    />
  );
}

// ---- Post Harvest Summary ----
const POST_HARVEST_SUMMARY_ROWS: MetricRow[] = [
  { kind: "single", label: "Date", type: "date", name: "date" },
  { kind: "single", label: "KGs", type: "number", name: "kgs" },
  { kind: "single", label: "Germination (%)", type: "number", name: "germinationPct", suffix: "%" },
  { kind: "single", label: "Remarks", type: "textarea", name: "remarks" },
];

export function PostHarvestSummaryForm({ cropDataId, farmId, initial }: BaseProps) {
  const mutation = useUpdateSection(cropDataId, farmId, "post_harvest_summary");
  return (
    <MetricForm
      title="Post Harvest Summary"
      rows={POST_HARVEST_SUMMARY_ROWS}
      initial={initial}
      schema={UpdatePostHarvestSummaryInputSchema}
      dateFields={POST_HARVEST_SUMMARY_DATE_FIELDS}
      showGenderColumns={false}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
    />
  );
}
