"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import { Info, Layers, Pencil, TestTube2, Trash2 } from "lucide-react";
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

function valueText(value: unknown, suffix = "") {
  if (value === null || value === undefined || value === "") return "-";
  return String(value) + suffix;
}

function pctText(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) + "%" : String(value);
}

function SeedsMetricRow({ label, value }: { label: string; value: unknown }) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-5 py-4 font-semibold text-muted-foreground">{label}</td>
      <td className="px-5 py-4 text-base font-bold text-slate-900">{valueText(value)}</td>
    </tr>
  );
}

export function SeedsQualityForm({ cropDataId, farmId, initial }: BaseProps) {
  const [editing, setEditing] = useState(false);
  const mutation = useUpdateSection(cropDataId, farmId, "seeds_quality");

  if (editing) {
    return (
      <MetricForm
        title="Seeds Quality Assessment"
        description="Log and manage germination metrics and laboratory testing results."
        icon={<TestTube2 className="h-4 w-4" />}
        editLabel="Edit Analysis"
        rows={SEEDS_QUALITY_ROWS}
        initial={initial}
        schema={UpdateSeedsQualityInputSchema}
        showGenderColumns={false}
        initialEditing
        isSaving={mutation.isPending}
        onSave={(values) => mutation.mutateAsync(values).finally(() => setEditing(false))}
      />
    );
  }

  const germinationPct = seedsQualityGerminationPct(initial ?? {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <TestTube2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Seeds Quality Assessment</h3>
            <p className="text-sm text-muted-foreground">
              Log and manage germination metrics and laboratory testing results.
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Analysis
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="w-[36%] px-5 py-4 text-left" />
                <th className="px-5 py-4 text-left text-base font-bold text-slate-900">
                  Actual Values
                </th>
              </tr>
            </thead>
            <tbody>
              <SeedsMetricRow label="Total Seeds Sown" value={initial?.totalSeedsSown} />
              <SeedsMetricRow label="Good1" value={initial?.good1} />
              <SeedsMetricRow label="Good2" value={initial?.good2} />
              <SeedsMetricRow label="Abnormal" value={initial?.abnormal} />
              <SeedsMetricRow label="Too Small" value={initial?.tooSmall} />
              <SeedsMetricRow label="Non Germinated" value={initial?.nonGerminated} />
              <SeedsMetricRow
                label="%G"
                value={germinationPct == null ? "-" : pctText(germinationPct)}
              />
              <SeedsMetricRow label="Crop Assessment Score" value={initial?.cropAssessmentScore} />
              <SeedsMetricRow
                label="KG Customer (After Cleaning)"
                value={initial?.kgCustomerAfterCleaning}
              />
            </tbody>
          </table>
          <div className="border-t bg-card px-5 py-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <Info className="h-4 w-4 text-primary" /> General Remarks
            </div>
            <div className="min-h-22 rounded-md border px-4 py-3 text-sm text-muted-foreground">
              {valueText(initial?.remarks)}
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-[1fr_1.35fr] gap-6 border-b pb-6">
            <div className="h-28 rounded-lg border border-dashed bg-muted/20" />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="px-4 py-3 text-left font-bold text-slate-900">Germination Tier</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900">Weight (KG)</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-900">Yield %</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 font-semibold text-muted-foreground">Good</td>
                  <td className="px-4 py-3 font-bold">85.00</td>
                  <td className="px-4 py-3 font-bold">85.00%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-semibold text-muted-foreground">Low</td>
                  <td className="px-4 py-3 font-bold">85.00</td>
                  <td className="px-4 py-3 font-bold">75.00%</td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-semibold text-muted-foreground">Cust. Good</td>
                  <td className="px-4 py-3 font-bold">5.55</td>
                  <td className="px-4 py-3 font-bold">29.00%</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-muted-foreground">Cust. Low</td>
                  <td className="px-4 py-3 font-bold">3.10</td>
                  <td className="px-4 py-3 font-bold">12.00%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="grid grid-cols-3 gap-4 border-b py-6">
            <div>
              <div className="mb-2 text-sm font-bold">Low Export Date</div>
              <div className="rounded-md border bg-muted/20 px-4 py-3 font-bold">28-04-2026</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold">Inbred Level</div>
              <div className="rounded-md border bg-muted/20 px-4 py-3 font-bold">43.00%</div>
            </div>
            <div>
              <div className="mb-2 text-sm font-bold">Off Type Level</div>
              <div className="rounded-md border bg-muted/20 px-4 py-3 font-bold">85.00%</div>
            </div>
          </div>
          <div className="pt-6">
            <div className="mb-2 text-sm font-bold">
              Actionable Recommendations <span className="text-rose-500">*</span>
            </div>
            <div className="min-h-28 rounded-md border border-emerald-100 bg-emerald-50/70 px-4 py-4 text-sm text-emerald-900">
              Recommendations
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- SQ Breakdown (KG's vs Germination %) ----
const SQ_BREAKDOWN_ROWS: MetricRow[] = [
  {
    kind: "mf",
    label: "Germination Good",
    type: "number",
    male: "germGoodKg",
    female: "germGoodPct",
  },
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
  const [editing, setEditing] = useState(false);
  const mutation = useUpdateSection(cropDataId, farmId, "sq_breakdown");

  if (editing) {
    return (
      <MetricForm
        title="Quality Breakdown"
        description="Manage seed categorizations and corresponding net weights."
        icon={<Layers className="h-4 w-4" />}
        editLabel="Add Category"
        rows={SQ_BREAKDOWN_ROWS}
        initial={initial}
        schema={UpdateSqBreakdownInputSchema}
        dateFields={SQ_BREAKDOWN_DATE_FIELDS}
        columnLabels={{ left: "KG's", right: "Germination %" }}
        initialEditing
        isSaving={mutation.isPending}
        onSave={(values) => mutation.mutateAsync(values).finally(() => setEditing(false))}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Quality Breakdown</h3>
            <p className="text-sm text-muted-foreground">
              Manage seed categorizations and corresponding net weights.
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
          + Add Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
        <table className="w-full table-fixed text-sm">
          <thead>
            <tr className="border-b bg-muted/20">
              <th className="px-5 py-4 text-left font-bold text-slate-900">Category Designation</th>
              <th className="px-5 py-4 text-left font-bold text-slate-900">Net Value (KG)</th>
              <th className="w-16 px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-5 py-4 font-bold text-slate-900">Testing</td>
              <td className="px-5 py-4 font-bold text-slate-900">149.00 KG</td>
              <td className="px-5 py-4 text-muted-foreground">
                <Trash2 className="h-4 w-4" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
  {
    kind: "computed",
    label: "Total Seeds Sown",
    compute: (v) => fmtNum(germinationTestTotal(v), 0),
  },
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
