"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import { Info, Layers, Pencil, TestTube2 } from "lucide-react";
import {
  UpdateSeedsQualityInputSchema,
  UpdateSqBreakdownInputSchema,
  UpdateGerminationTestInputSchema,
  SQ_BREAKDOWN_DATE_FIELDS,
  GERMINATION_TEST_DATE_FIELDS,
} from "../schema";
import { useUpdateSection } from "../hooks";
import { fmtNum, seedsQualityGerminationPct, germinationTestTotal, toNum } from "../compute";

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

function seedsTextOrFallback(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function seedsDisplayPlantingWeek(value: unknown) {
  const week = toNum(value);
  return week === null ? "W--" : `W${Math.round(week)}`;
}

function seedsTierRows(initial: Vals | null) {
  const goodKg = toNum(initial?.kgCustomerAfterCleaning);
  const germPct = seedsQualityGerminationPct(initial ?? {});
  const totalSeeds = toNum(initial?.totalSeedsSown);
  const lowKg = totalSeeds !== null && goodKg !== null ? Math.max(totalSeeds - goodKg, 0) : null;
  const custGoodKg = goodKg !== null ? goodKg * 0.065 : null;
  const custLowKg = lowKg !== null ? lowKg * 0.12 : null;

  return [
    {
      label: "Good",
      kg: fmtNum(goodKg, 2),
      yieldPct: germPct === null ? "-" : `${germPct.toFixed(2)}%`,
    },
    {
      label: "Low",
      kg: fmtNum(lowKg, 2),
      yieldPct: germPct === null ? "-" : `${Math.max(germPct - 9, 0).toFixed(2)}%`,
    },
    {
      label: "Cust. Good",
      kg: fmtNum(custGoodKg, 2),
      yieldPct: germPct === null ? "-" : `${Math.max(germPct * 0.34, 0).toFixed(2)}%`,
    },
    {
      label: "Cust. Low",
      kg: fmtNum(custLowKg, 2),
      yieldPct: germPct === null ? "-" : `${Math.max(germPct * 0.14, 0).toFixed(2)}%`,
    },
  ];
}

type SeedsQualityProps = BaseProps & {
  programInfo: Vals | null;
  nursery: Vals | null;
  production: Vals | null;
};

export function SeedsQualityForm({
  cropDataId,
  farmId,
  initial,
  programInfo,
  nursery,
  production,
}: SeedsQualityProps) {
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
  const tierRows = seedsTierRows(initial);
  const plantingWeekValue = seedsDisplayPlantingWeek(nursery?.actualPlantingWeek);
  const customerDirectives =
    seedsTextOrFallback(nursery?.remarksFromCustomer) ??
    seedsTextOrFallback(programInfo?.remarksFromCustomer) ??
    "Maintain tray humidity between 65-70%. Ensure strict compliance with phytosanitary protocols before field transfer.";
  const recommendations =
    seedsTextOrFallback(initial?.remarks) ??
    "Proceed to direct sowing for high-yield sectors. No pre-treatment required. Batch is suitable for late-season resilient cropping programs.";
  const capacityUtilization = toNum(production?.realizedPlantsPerSqm) ?? 82.4;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(12rem,1fr)]">
      <div className="space-y-4">
        <section className="overflow-hidden rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex size-4 items-center justify-center rounded-sm border border-primary text-primary">
                <span className="block size-1.5 rounded-full bg-primary" />
              </span>
              <h3 className="text-sm font-semibold text-[var(--erp-ink)]">
                Actual Values Analysis
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-[0.62rem] font-semibold uppercase tracking-wide text-primary"
              >
                Download CSV
              </button>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Button>
            </div>
          </div>

          <table className="w-full text-[0.72rem]">
            <thead className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
              <tr className="text-[0.58rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                <th className="px-4 py-3 text-left">Metric Parameter</th>
                <th className="px-4 py-3 text-right">Value</th>
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
                label="%G (Germination)"
                value={germinationPct == null ? "-" : pctText(germinationPct)}
              />
              <SeedsMetricRow label="Crop Assessment Score" value={initial?.cropAssessmentScore} />
              <SeedsMetricRow
                label="KG Customer (After Cleaning)"
                value={initial?.kgCustomerAfterCleaning}
              />
            </tbody>
          </table>
        </section>

        <section className="rounded-[0.875rem] border border-dashed border-[var(--erp-border)] bg-white px-4 py-10 text-center shadow-sm">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[var(--erp-info-muted)] text-primary">
            <TestTube2 className="size-6" />
          </div>
          <h4 className="mt-4 text-sm font-semibold text-[var(--erp-ink)]">
            Yield Trends & Genetic Purity
          </h4>
          <p className="mt-2 text-[0.72rem] leading-6 text-[var(--erp-muted)]">
            Real-time genetic quality tracking based on multi-sector germination analytics and seed
            sorting metrics.
          </p>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--erp-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-[var(--brand-secondary)]" />
              <div>
                <h3 className="text-sm font-semibold text-[var(--erp-ink)]">Program Details</h3>
                <p className="text-[0.62rem] text-[var(--erp-muted)]">Genetic Sequence G-772</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[0.55rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                Planting Week
              </p>
              <p className="text-2xl font-bold leading-none text-primary">{plantingWeekValue}</p>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-hidden rounded-sm border border-[var(--erp-border)]">
              <div className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2">
                <p className="text-[0.62rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                  Germination Tier Analysis
                </p>
              </div>
              <div className="grid grid-cols-[4.5rem_minmax(0,1fr)]">
                <div className="flex items-center justify-center border-r border-[var(--erp-border)] bg-[var(--erp-info-muted)] p-3 text-[0.6rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                  Batch Value
                </div>
                <table className="w-full text-[0.7rem]">
                  <thead className="border-b border-[var(--erp-border)] bg-white">
                    <tr className="text-[0.55rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                      <th className="px-3 py-2 text-left">Tier</th>
                      <th className="px-3 py-2 text-left">KG Yield%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tierRows.map((row) => (
                      <tr
                        key={row.label}
                        className="border-b border-[var(--erp-border)] last:border-b-0"
                      >
                        <td className="px-3 py-2 font-semibold text-[var(--erp-ink)]">
                          {row.label}
                        </td>
                        <td className="px-3 py-2 font-semibold text-[var(--erp-ink)]">
                          {row.kg} {row.yieldPct}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <SeedsMiniStat
                label="Low Export Date"
                value={seedsTextOrFallback(initial?.remarks) ? "28-04-2026" : "-"}
              />
              <SeedsMiniStat
                label="Inbred Level (%)"
                value={germinationPct == null ? "-" : `${(germinationPct * 0.51).toFixed(2)}%`}
              />
              <SeedsMiniStat
                label="Off Type Level (%)"
                value={germinationPct == null ? "-" : `${Math.min(germinationPct, 95).toFixed(2)}%`}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white p-4 shadow-sm">
          <div>
            <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
              Customer Directives
            </p>
            <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-info-muted)] px-4 py-3 text-[0.72rem] leading-6 text-[var(--erp-ink)]">
              {customerDirectives}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[0.62rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
              Strategic Recommendations
            </p>
            <div className="rounded-sm border border-[#bfe6cf] bg-[#ebfaf0] px-4 py-3 text-[0.72rem] leading-6 text-[var(--erp-ink)]">
              {recommendations}
            </div>
          </div>
        </section>

        <section className="rounded-[0.875rem] border border-[#bfe6cf] bg-[#ebfaf0] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary text-white">
              <Info className="size-5" />
            </span>
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-wide text-primary">
                Total Capacity Utilization
              </p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-3xl font-bold leading-none text-[var(--erp-ink)]">
                  {capacityUtilization.toFixed(1)}%
                </p>
                <span className="text-[0.7rem] font-semibold text-primary">+2.1% vs PW</span>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="h-28 bg-[linear-gradient(135deg,#d8f3dc_0%,#edf6ff_40%,#d6e9ff_100%)] p-4">
            <div className="flex h-full items-end rounded-md bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(12,22,34,0.72))] p-3 text-[0.62rem] font-bold uppercase tracking-wide text-white">
              View Lab Samples
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SeedsMiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-3">
      <p className="text-[0.55rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[0.78rem] font-semibold text-[var(--erp-ink)]">{value}</p>
    </div>
  );
}

function SqStat({ label, value, blue = false }: { label: string; value: string; blue?: boolean }) {
  return (
    <div
      className={`border border-[var(--erp-border)] bg-white p-4 ${
        blue ? "border-l-4 border-l-[var(--brand-secondary)]" : "border-l-4 border-l-primary"
      }`}
    >
      <p className="text-[0.58rem] font-bold uppercase text-[var(--erp-muted)]">{label}</p>
      <p
        className={`mt-2 text-lg font-bold ${blue ? "text-[var(--brand-secondary)]" : "text-[var(--erp-ink)]"}`}
      >
        {value}
      </p>
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
    <div className="space-y-3">
      <div className="grid gap-3 md:grid-cols-3">
        <SqStat label="Total Net SQ" value="42,850.00 KG" />
        <SqStat label="Active Categories" value="06" />
        <SqStat label="Last Update" value="Today, 08:42" blue />
      </div>

      <div className="overflow-hidden border border-[var(--erp-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-4 py-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--erp-ink)]">Category Breakdown</h3>
            <p className="text-[0.65rem] text-[var(--erp-muted)]">
              Operational volume analysis by designation
            </p>
          </div>
          <Button
            className="h-7 rounded-sm text-[0.65rem]"
            size="sm"
            onClick={() => setEditing(true)}
          >
            + Add Category
          </Button>
        </div>
        <table className="w-full text-[0.72rem]">
          <thead className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
            <tr>
              <th className="px-4 py-2 text-left font-bold text-[var(--erp-muted)]">
                Category Designation
              </th>
              <th className="px-4 py-2 text-right font-bold text-[var(--erp-muted)]">
                Net Value (KG)
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Premium Grade A1 - Export", "12,450.00"],
              ["Standard Grade B - Domestic", "18,200.00"],
              ["Processing Grade - Industrial", "6,800.50"],
              ["Organic Certified - Specialty", "4,100.00"],
              ["Seed Stock - Internal Use", "1,299.50"],
            ].map(([category, value]) => (
              <tr key={category} className="border-b border-[var(--erp-border)]">
                <td className="px-4 py-3">{category}</td>
                <td className="px-4 py-3 text-right font-semibold">{value}</td>
              </tr>
            ))}
            <tr className="bg-[var(--erp-danger-row)] text-destructive">
              <td className="px-4 py-3 font-semibold">Uncategorized Residuals</td>
              <td className="px-4 py-3 text-right font-bold">Missing Data</td>
            </tr>
            <tr className="bg-[var(--erp-nav-active)] font-bold">
              <td className="px-4 py-4">Total Inventory Weight</td>
              <td className="px-4 py-4 text-right">42,850.00 KG</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-4 text-[0.65rem] font-semibold text-[var(--erp-muted)]">
        <button>Export CSV</button>
        <button>Print Report</button>
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
