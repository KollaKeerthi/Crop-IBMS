import { useMemo } from "react";
import Image from "next/image";
import { Filter, TrendingUp } from "lucide-react";
import { RowTableEditor, type RowColumn } from "./row-table-editor";
import type { Vals } from "./metric-form";
import {
  HarvestRecordInputSchema,
  PerformanceInputSchema,
  HARVEST_RECORD_DATE_FIELDS,
  PERFORMANCE_DATE_FIELDS,
} from "../schema";
import { useCollectionMutations } from "../hooks";
import { fmtNum, harvestGrPerM2, seedsQualityGerminationPct, toNum } from "../compute";

type Props = {
  cropDataId: string;
  farmId: string;
  rows: Vals[];
};

type HarvestProps = Props & {
  seedsQuality: Vals | null;
};

type PerformanceProps = Props & {
  harvestRows?: Vals[];
  blockAverage?: number | null;
};

// ---- Harvest Details ----
const HARVEST_COLUMNS: RowColumn[] = [
  { name: "harvestDate", label: "Date", type: "date" },
  { name: "block", label: "Block", type: "text" },
  { name: "variety", label: "Variety", type: "text" },
  { name: "code", label: "Code", type: "text" },
  { name: "rowM2", label: "Row m2", type: "number" },
  { name: "rowNo", label: "Row No", type: "int" },
  { name: "empName", label: "Emp Name", type: "text" },
  { name: "harvestCode", label: "Harvest Code", type: "text" },
  { name: "kg", label: "Kg", type: "number" },
  { name: "germinationPct", label: "% Germination", type: "number" },
  { name: "remarks", label: "Remarks", type: "text" },
];

export function HarvestDetailsTable({ cropDataId, farmId, rows, seedsQuality }: HarvestProps) {
  const mutations = useCollectionMutations(cropDataId, farmId, "harvest_records");

  const seedsG = useMemo(() => {
    return seedsQuality ? seedsQualityGerminationPct(seedsQuality) : null;
  }, [seedsQuality]);

  const mappedRows = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      germinationPct:
        r.germinationPct !== null && r.germinationPct !== undefined && r.germinationPct !== ""
          ? r.germinationPct
          : seedsG,
    }));
  }, [rows, seedsG]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-bold uppercase tracking-widest text-[var(--erp-muted)]">
            Crop Data / Block 42A / Summer Tomato / Hybrid T-900
          </p>
          <h2 className="mt-1 text-lg font-bold text-[var(--erp-ink)]">Harvest Details</h2>
          <p className="text-[0.68rem] text-[var(--erp-muted)]">
            Operational logging for current crop cycle production.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[0.65rem]">
          <button className="border border-[var(--erp-border)] bg-white px-3 py-1.5 font-semibold">
            Export
          </button>
          <button className="border border-[var(--erp-border)] bg-white px-3 py-1.5 font-semibold">
            Bulk Upload
          </button>
          <button className="bg-primary px-3 py-1.5 font-semibold text-white">New Record</button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard
          label="Total Weight"
          value={`${fmtNum(totalKg(mappedRows), 1)} kg`}
          note="+12% vs Prev Batch"
        />
        <MetricCard
          label="Avg % Germination"
          value={`${fmtNum(avgGermination(mappedRows), 1)}%`}
          note="Target: >92.0%"
        />
        <MetricCard
          label="Efficiency Index"
          value={`${fmtNum(avgGrm2(mappedRows), 2)} g/m2`}
          note="Below threshold in Block 42A"
          alert
        />
        <MetricCard label="Active Blocks" value="12 / 18" note="Operationally active" progress />
      </div>

      <RowTableEditor
        title="Detailed Operations Log"
        description="Live sync"
        newLabel="New Record"
        showExport
        showBulkUpload
        columns={HARVEST_COLUMNS}
        computed={[{ label: "Gr/m2", compute: (r) => fmtNum(harvestGrPerM2(r)) }]}
        dateFields={HARVEST_RECORD_DATE_FIELDS}
        schema={HarvestRecordInputSchema}
        rows={mappedRows}
        mutations={mutations}
        defaultValues={{ germinationPct: seedsG ?? "" }}
        after={<HarvestAnalysis />}
      />
    </div>
  );
}

// ---- Performance per person ----
const PERFORMANCE_COLUMNS: RowColumn[] = [
  { name: "date", label: "Date", type: "date" },
  { name: "empName", label: "Employee", type: "text" },
  { name: "activity", label: "Activity", type: "text" },
  { name: "outputQty", label: "Output", type: "number" },
  { name: "notes", label: "Notes", type: "text" },
];

function performanceTone(value: unknown, blockAverage: number | null) {
  const output = toNum(value);
  if (output === null || blockAverage === null) return "text-muted-foreground";
  if (output < blockAverage) return "text-destructive";
  if (output > blockAverage) return "text-primary";
  return "text-muted-foreground";
}

export function PerformanceTable({
  cropDataId,
  farmId,
  rows,
  harvestRows = [],
  blockAverage = null,
}: PerformanceProps) {
  const mutations = useCollectionMutations(cropDataId, farmId, "performance");
  const displayRows = useMemo(() => {
    if (rows.length > 0) return rows;
    return harvestRows.map((row, index) => ({
      id: row.id ?? `harvest-${index}`,
      date: row.harvestDate,
      empName: row.empName,
      activity: "Harvesting",
      outputQty: harvestGrPerM2(row),
      notes: row.remarks,
    }));
  }, [harvestRows, rows]);

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-primary">Performance Tracking</h2>
            <div className="mt-1 flex items-center gap-4 text-[0.65rem] font-semibold text-[var(--erp-muted)]">
              <span>Crop Data</span>
              <span>Analytics</span>
            </div>
          </div>
          <div className="hidden min-w-64 items-center gap-2 border border-[var(--erp-border)] bg-white px-2 py-1.5 text-[0.65rem] text-[var(--erp-muted)] md:flex">
            <Filter className="size-3.5" />
            Search data...
          </div>
        </div>

        <RowTableEditor
          title="Operator Performance Records"
          newLabel="New Record"
          showBulkUpload
          columns={PERFORMANCE_COLUMNS}
          computed={[
            {
              label: "Performance",
              compute: (row) => {
                const value = toNum(row.outputQty);
                if (value === null || blockAverage === null) return "-";
                if (value < blockAverage) return "Least";
                if (value > blockAverage) return "Best";
                return "Average";
              },
              className: (row) => performanceTone(row.outputQty, blockAverage),
            },
          ]}
          dateFields={PERFORMANCE_DATE_FIELDS}
          schema={PerformanceInputSchema}
          rows={displayRows}
          mutations={mutations}
          readOnly={rows.length === 0 && harvestRows.length > 0}
        />
      </div>
      <TeamInsights rows={displayRows} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  alert,
  progress,
}: {
  label: string;
  value: string;
  note: string;
  alert?: boolean;
  progress?: boolean;
}) {
  return (
    <div className="border border-[var(--erp-border)] bg-white p-3">
      <p className="text-[0.62rem] font-bold text-[var(--erp-muted)]">{label}</p>
      <p className="mt-2 text-lg font-bold text-[var(--erp-ink)]">{value}</p>
      <p
        className={
          alert
            ? "mt-1 text-[0.58rem] font-semibold text-destructive"
            : "mt-1 text-[0.58rem] font-semibold text-primary"
        }
      >
        {note}
      </p>
      {progress ? (
        <div className="mt-3 h-1.5 bg-[var(--erp-track)]">
          <div className="h-full w-[66%] bg-primary" />
        </div>
      ) : null}
    </div>
  );
}

function HarvestAnalysis() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="relative min-h-44 overflow-hidden border border-[var(--erp-border)] bg-white">
        <Image
          src="/images/crop-field-aerial.jpg"
          alt="Spatial yield map"
          width={900}
          height={675}
          className="h-full min-h-44 w-full object-cover"
        />
        <div className="absolute left-3 top-3 bg-white/90 px-3 py-2">
          <p className="text-xs font-bold text-[var(--erp-ink)]">Spatial Yield Map</p>
          <p className="text-[0.62rem] text-[var(--erp-muted)]">
            Hover blocks to view live harvest progress.
          </p>
        </div>
      </div>

      <div className="border border-[var(--erp-border)] bg-white p-4">
        <h3 className="text-xs font-bold text-[var(--erp-ink)]">Batch Performance Analysis</h3>
        <div className="mt-4 space-y-3">
          <AnalysisBar label="Batch Consistency" value="92%" color="bg-primary" />
          <AnalysisBar label="Germination Target" value="88%" color="bg-[var(--brand-secondary)]" />
          <AnalysisBar label="Labour Efficiency" value="74%" color="bg-[var(--erp-road)]" />
        </div>
      </div>
    </div>
  );
}

function AnalysisBar({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[0.65rem] font-semibold text-[var(--erp-ink)]">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="h-2 bg-[var(--erp-track)]">
        <div className={`h-full ${color}`} style={{ width: value }} />
      </div>
    </div>
  );
}

function TeamInsights({ rows }: { rows: Vals[] }) {
  return (
    <aside className="space-y-3">
      <div className="border border-[var(--erp-border)] bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--erp-ink)]">Team Insights</h3>
          <TrendingUp className="size-4 text-primary" />
        </div>
        <p className="mt-1 text-[0.68rem] text-[var(--erp-muted)]">
          Weekly performance aggregation for all active field operators.
        </p>
        <div className="mt-4 space-y-3">
          <AnalysisBar label="Harvesting Efficiency" value="96%" color="bg-primary" />
          <AnalysisBar label="Task Compliance" value="96%" color="bg-[var(--brand-secondary)]" />
        </div>
      </div>

      <div className="border border-[var(--erp-border)] bg-white p-4">
        <h3 className="text-[0.68rem] font-bold uppercase text-[var(--erp-muted)]">
          Top Performers
        </h3>
        <div className="mt-3 space-y-3">
          {rows.slice(0, 2).map((row, index) => (
            <div
              key={String(row.id ?? index)}
              className="flex items-center justify-between text-xs"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-[var(--erp-ink)]">
                <span className="flex size-6 items-center justify-center rounded-full bg-[var(--erp-green-muted)] text-[0.62rem] text-primary">
                  {String(row.empName ?? "OP")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                {String(row.empName ?? `Operator ${index + 1}`)}
              </span>
              <span className="font-bold text-primary">{index === 0 ? "102%" : "98%"}</span>
            </div>
          ))}
        </div>
        <button className="mt-4 w-full bg-[var(--erp-nav-active)] px-3 py-2 text-[0.68rem] font-bold text-[var(--erp-ink)]">
          View Full Analytics Report
        </button>
      </div>

      <div className="relative h-32 overflow-hidden border border-[var(--erp-border)]">
        <Image
          src="/images/crop-field-aerial.jpg"
          alt="North block overview"
          width={900}
          height={675}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs font-bold text-white">
          North Block Overview
        </div>
      </div>
    </aside>
  );
}

function totalKg(rows: Vals[]) {
  return rows.reduce((total, row) => total + (toNum(row.kg) ?? 0), 0);
}

function avgGermination(rows: Vals[]) {
  const values = rows
    .map((row) => toNum(row.germinationPct))
    .filter((value): value is number => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}

function avgGrm2(rows: Vals[]) {
  const values = rows
    .map((row) => harvestGrPerM2(row))
    .filter((value): value is number => value !== null);
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
}
