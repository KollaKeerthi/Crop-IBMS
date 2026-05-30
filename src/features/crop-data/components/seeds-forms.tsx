"use client";

import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import {
  UpdateSeedsQualityInputSchema,
  UpdateSqBreakdownInputSchema,
  UpdateGerminationTestInputSchema,
  SQ_BREAKDOWN_DATE_FIELDS,
  GERMINATION_TEST_DATE_FIELDS,
} from "../schema";
import { useUpdateSection } from "../hooks";
import { fmtNum, seedsQualityGerminationPct, germinationTestTotal } from "../compute";

type BaseProps = {
  cropDataId: string;
  farmId: string;
  initial: Vals | null;
};

// ---- Seeds Quality ----
const SEEDS_QUALITY_ROWS: MetricRow[] = [
  { kind: "single", label: "Total Seeds Sown", type: "int", name: "totalSeedsSown" },
  { kind: "single", label: "Good1", type: "int", name: "good1" },
  { kind: "single", label: "Good2", type: "int", name: "good2" },
  { kind: "single", label: "Abnormal", type: "int", name: "abnormal" },
  { kind: "single", label: "Too Small", type: "int", name: "tooSmall" },
  { kind: "single", label: "Non Germinated", type: "int", name: "nonGerminated" },
  { kind: "computed", label: "%G", compute: (v) => fmtNum(seedsQualityGerminationPct(v)) },
  { kind: "single", label: "Crop Assessment Score", type: "number", name: "cropAssessmentScore" },
  {
    kind: "single",
    label: "KG Customer (After Cleaning)",
    type: "number",
    name: "kgCustomerAfterCleaning",
  },
  { kind: "single", label: "Remarks", type: "textarea", name: "remarks" },
];

export function SeedsQualityForm({ cropDataId, farmId, initial }: BaseProps) {
  const mutation = useUpdateSection(cropDataId, farmId, "seeds_quality");
  return (
    <MetricForm
      title="Seeds Quality"
      rows={SEEDS_QUALITY_ROWS}
      initial={initial}
      schema={UpdateSeedsQualityInputSchema}
      showGenderColumns={false}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
    />
  );
}

// ---- SQ Breakdown (KG's vs Germination %) ----
const SQ_BREAKDOWN_ROWS: MetricRow[] = [
  { kind: "mf", label: "Germination Good", type: "number", male: "germGoodKg", female: "germGoodPct" },
  { kind: "mf", label: "Germination Low", type: "number", male: "germLowKg", female: "germLowPct" },
  {
    kind: "mf",
    label: "Germination Customer Good",
    type: "number",
    male: "germCustomerGoodKg",
    female: "germCustomerGoodPct",
  },
  {
    kind: "mf",
    label: "Germination Customer Low",
    type: "number",
    male: "germCustomerLowKg",
    female: "germCustomerLowPct",
  },
  {
    kind: "single",
    label: "Germination Low Export Date",
    type: "date",
    name: "germLowExportDate",
    placement: "span",
  },
  { kind: "single", label: "Inbred %", type: "number", name: "inbredPct", placement: "span" },
  { kind: "single", label: "Off Type", type: "number", name: "offType", placement: "span" },
  {
    kind: "single",
    label: "Recommendations",
    type: "textarea",
    name: "recommendations",
    placement: "span",
  },
];

export function SqBreakdownForm({ cropDataId, farmId, initial }: BaseProps) {
  const mutation = useUpdateSection(cropDataId, farmId, "sq_breakdown");
  return (
    <MetricForm
      title="SQ Breakdown"
      rows={SQ_BREAKDOWN_ROWS}
      initial={initial}
      schema={UpdateSqBreakdownInputSchema}
      dateFields={SQ_BREAKDOWN_DATE_FIELDS}
      columnLabels={{ left: "KG's", right: "Germination %" }}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
    />
  );
}

// ---- Germination Test ----
const GERMINATION_TEST_ROWS: MetricRow[] = [
  { kind: "single", label: "Sown", type: "date", name: "sownDate" },
  { kind: "single", label: "Final Count", type: "date", name: "finalCountDate" },
  { kind: "single", label: "Sown on (Soil / Paper)", type: "text", name: "sownOn" },
  { kind: "single", label: "Good", type: "int", name: "good" },
  { kind: "single", label: "Small", type: "int", name: "small" },
  { kind: "single", label: "Too small", type: "int", name: "tooSmall" },
  { kind: "single", label: "Abnormal", type: "int", name: "abnormal" },
  { kind: "single", label: "Rotting", type: "int", name: "rotting" },
  { kind: "single", label: "No Ger", type: "int", name: "noGer" },
  { kind: "computed", label: "Total Seeds Sown", compute: (v) => fmtNum(germinationTestTotal(v), 0) },
  { kind: "single", label: "Remarks", type: "textarea", name: "remarks" },
  { kind: "single", label: "Emp Name", type: "text", name: "empName" },
];

export function GerminationTestForm({ cropDataId, farmId, initial }: BaseProps) {
  const mutation = useUpdateSection(cropDataId, farmId, "germination_test");
  return (
    <MetricForm
      title="Germination Test"
      rows={GERMINATION_TEST_ROWS}
      initial={initial}
      schema={UpdateGerminationTestInputSchema}
      dateFields={GERMINATION_TEST_DATE_FIELDS}
      showGenderColumns={false}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values)}
    />
  );
}
