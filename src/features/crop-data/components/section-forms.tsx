"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  CircleAlert,
  Flower2,
  Info,
  Pencil,
  Plus,
  Sprout,
  Truck,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatDateDisplay } from "@/lib/format";
import type { Vals } from "./metric-form";
import {
  UpdateProductionInputSchema,
  UpdatePollinationInputSchema,
  UpdatePostHarvestInputSchema,
  UpdatePostHarvestSummaryInputSchema,
} from "../schema";
import { useUpdateSection } from "../hooks";
import {
  fmtNum,
  pollinationEstimatedYield,
  postHarvestComputations,
  computeProductionDerivedFields,
  toNum,
} from "../compute";

type BaseProps = {
  cropDataId: string;
  farmId: string;
  initial: Vals | null;
};

function fieldDisplay(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function numberInputValue(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function parseNumberValue(value: unknown) {
  return value === "" || value === null || value === undefined ? null : Number(value);
}

function dateInputValue(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function LegacyProductionForm({
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
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(mergedInitial);

  function startEdit() {
    setValues(mergedInitial);
    setEditing(true);
  }

  function setField(name: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      return { ...next, ...computeProductionDerivedFields(next, nursery, programInfo) };
    });
  }

  async function saveProduction() {
    const payload = {
      realizedPlants: parseNumberValue(values.realizedPlants),
      realizedRows: parseNumberValue(values.realizedRows),
      realizedSurfaceArea: parseNumberValue(values.realizedSurfaceArea),
      realizedPlantsPerSqm: parseNumberValue(values.realizedPlantsPerSqm),
      avgTemperature: parseNumberValue(values.avgTemperature),
      avgRadiation: parseNumberValue(values.avgRadiation),
      avgHumidity: parseNumberValue(values.avgHumidity),
      remarks: values.remarks === "" ? null : values.remarks,
      recommendations: values.recommendations === "" ? null : values.recommendations,
    };
    const parsed = UpdateProductionInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted production fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Production Details saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save production details.");
    }
  }

  const displayValues = editing ? values : mergedInitial;
  const productionRows = [
    ["Realized No of Plants", "realizedPlants"],
    ["Realized No of Rows", "realizedRows"],
    ["Realized Surface Area", "realizedSurfaceArea"],
    ["Realized Plants / m²", "realizedPlantsPerSqm"],
  ] as const;
  const climateRows = [
    ["Avg Temperature", "avgTemperature"],
    ["Avg Radiation", "avgRadiation"],
    ["Avg Humidity", "avgHumidity"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Production Details</h3>
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={saveProduction} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.95fr)]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Metric Definition</th>
                <th className="px-4 py-3 text-left font-semibold text-primary">
                  Realized Performance
                </th>
              </tr>
            </thead>
            <tbody>
              {productionRows.map(([label, name]) => (
                <tr key={name} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{label}</td>
                  <td className="px-4 py-3 font-semibold">
                    {editing ? (
                      <Input
                        className="h-9 max-w-48"
                        type="number"
                        step="any"
                        value={numberInputValue(values[name])}
                        onChange={(event) => setField(name, event.target.value)}
                      />
                    ) : (
                      fieldDisplay(displayValues[name])
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-5">
            <div className="h-24 rounded-lg border border-dashed bg-muted/30" />
            <div className="space-y-3">
              {climateRows.map(([label, name]) => (
                <div key={name} className="grid grid-cols-[1fr_6rem] items-center gap-3">
                  <span className="font-semibold">{label}</span>
                  {editing ? (
                    <Input
                      className="h-9"
                      type="number"
                      step="any"
                      value={numberInputValue(values[name])}
                      onChange={(event) => setField(name, event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold">{fieldDisplay(displayValues[name])}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t pt-5">
            <label className="text-sm font-semibold">Remarks</label>
            {editing ? (
              <Textarea
                className="mt-2"
                rows={3}
                value={(values.remarks ?? "") as string}
                onChange={(event) => setField("remarks", event.target.value)}
              />
            ) : (
              <div className="mt-2 min-h-20 rounded-md border px-4 py-3 text-sm">
                {fieldDisplay(displayValues.remarks)}
              </div>
            )}
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold">
              Actionable Recommendations <span className="text-destructive">*</span>
            </label>
            {editing ? (
              <Textarea
                className="mt-2 border-emerald-100 bg-emerald-50/70"
                rows={4}
                value={(values.recommendations ?? "") as string}
                onChange={(event) => setField("recommendations", event.target.value)}
              />
            ) : (
              <div className="mt-2 min-h-24 rounded-md border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                {fieldDisplay(displayValues.recommendations)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="border border-[var(--erp-border)] bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--erp-ink)]">Density Heatmap</h3>
            <span className="text-[0.62rem] font-semibold text-[var(--erp-muted)]">
              Block A4 Spatial Distribution
            </span>
          </div>
          <div className="grid grid-cols-[repeat(12,minmax(0,1fr))] gap-1 bg-[var(--erp-nav-active)] p-3">
            {Array.from({ length: 36 }, (_, index) => (
              <span
                key={index}
                className={cn(
                  "h-8",
                  index === 7 || index === 20
                    ? "bg-destructive/40"
                    : index % 5 === 0
                      ? "bg-[var(--erp-track)]"
                      : "bg-primary"
                )}
              />
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[0.62rem] font-semibold">
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-primary" />
              Optimal
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="size-2 rounded-full bg-destructive/60" />
              Critical
            </span>
          </div>
        </section>

        <section className="border border-[var(--erp-border)] bg-white p-4">
          <h3 className="text-sm font-bold text-[var(--erp-ink)]">Environmental Status</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <EnvMetric
              label="Avg Temp"
              value={`${fieldDisplay(displayValues.avgTemperature)}°C`}
              note="+0.4"
            />
            <EnvMetric
              label="Radiation"
              value={`${fieldDisplay(displayValues.avgRadiation)} J/cm2`}
              note="Stable"
            />
            <EnvMetric
              label="Humidity"
              value={`${fieldDisplay(displayValues.avgHumidity)}%`}
              note="-2%"
            />
          </div>
          <div className="mt-4 border-l-2 border-[var(--brand-secondary)] bg-[var(--erp-info-muted)] p-3 text-[0.68rem]">
            <p className="font-bold text-[var(--brand-secondary)]">Operational Remark</p>
            <p className="mt-1 text-[var(--erp-ink)]">
              Minor localized mortality observed. Recommended soil moisture analysis to rule out
              root rot issues.
            </p>
          </div>
          <div className="mt-3 bg-[var(--erp-warning-muted)] p-3 text-[0.68rem]">
            <p className="font-bold text-[var(--erp-warning)]">Maintenance Log</p>
            <p>Sensor node recalibrated. Data consistency back within normal variance range.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

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
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(mergedInitial);

  function startEdit() {
    setValues(mergedInitial);
    setEditing(true);
  }

  function setField(name: string, value: unknown) {
    setValues((current) => {
      const next = { ...current, [name]: value };
      return { ...next, ...computeProductionDerivedFields(next, nursery, programInfo) };
    });
  }

  async function saveProduction() {
    const payload = {
      realizedPlants: parseNumberValue(values.realizedPlants),
      realizedRows: parseNumberValue(values.realizedRows),
      realizedSurfaceArea: parseNumberValue(values.realizedSurfaceArea),
      realizedPlantsPerSqm: parseNumberValue(values.realizedPlantsPerSqm),
      avgTemperature: parseNumberValue(values.avgTemperature),
      avgRadiation: parseNumberValue(values.avgRadiation),
      avgHumidity: parseNumberValue(values.avgHumidity),
      remarks: values.remarks === "" ? null : values.remarks,
      recommendations: values.recommendations === "" ? null : values.recommendations,
    };
    const parsed = UpdateProductionInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted production fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Production saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save production.");
    }
  }

  const displayValues = editing ? values : mergedInitial;
  const productionRows = [
    ["Realized No of Plants", "realizedPlants"],
    ["Realized No of Rows", "realizedRows"],
    ["Realized Surface Area", "realizedSurfaceArea"],
    ["Realized Plants / m2", "realizedPlantsPerSqm"],
  ] as const;
  const climateRows = [
    ["Avg Temperature (°C)", "avgTemperature"],
    ["Avg Radiation (j/cm2)", "avgRadiation"],
    ["Avg Humidity (%)", "avgHumidity"],
  ] as const;
  const plantingWeekValue = prodDisplayPlantingWeek(nursery?.actualPlantingWeek);
  const customerDirectives =
    prodTextOrFallback(nursery?.remarksFromCustomer) ??
    prodTextOrFallback(programInfo?.remarksFromCustomer);
  const recommendationsList = prodListOrFallback(displayValues.recommendations) ?? [];
  const utilization = prodUtilization(displayValues, nursery);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(12rem,1fr)]">
      <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex size-4 items-center justify-center rounded-sm border border-primary text-primary">
              <span className="block size-1.5 rounded-full bg-primary" />
            </span>
            <h3 className="text-sm font-semibold text-[var(--erp-ink)]">Production Overview</h3>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                <X className="mr-1.5 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={saveProduction}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <Button type="button" size="sm" onClick={startEdit}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit Operations
            </Button>
          )}
        </div>

        <div className="grid gap-6 p-4 lg:grid-cols-2">
          <div>
            <p className="text-[0.62rem] font-bold text-[var(--erp-muted)]">Realized Counts</p>
            <div className="mt-4 space-y-3">
              {productionRows.map(([label, name]) => (
                <ProdValueRow
                  key={name}
                  label={label}
                  value={
                    editing ? (
                      <Input
                        className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-right text-[0.78rem] font-semibold"
                        type="number"
                        step="any"
                        value={numberInputValue(values[name])}
                        onChange={(event) => setField(name, event.target.value)}
                      />
                    ) : (
                      <span className="font-semibold text-[var(--erp-ink)]">
                        {fieldDisplay(displayValues[name])}
                      </span>
                    )
                  }
                />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[0.62rem] font-bold text-[var(--erp-muted)]">
              Environmental Cycle Data
            </p>
            <div className="mt-4 space-y-3">
              {climateRows.map(([label, name]) => (
                <ProdValueRow
                  key={name}
                  label={label}
                  value={
                    editing ? (
                      <Input
                        className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-right text-[0.78rem] font-semibold"
                        type="number"
                        step="any"
                        value={numberInputValue(values[name])}
                        onChange={(event) => setField(name, event.target.value)}
                      />
                    ) : (
                      <span className="font-semibold text-[var(--erp-ink)]">
                        {fieldDisplay(displayValues[name])}
                      </span>
                    )
                  }
                />
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--erp-border)] px-4 py-4">
          <p className="text-[0.62rem] font-bold text-[var(--erp-muted)]">Operational Notes</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_11.5rem]">
            <div>
              <label className="mb-2 block text-[0.72rem] font-semibold text-[var(--erp-ink)]">
                Remarks
              </label>
              {editing ? (
                <Textarea
                  className="min-h-24 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
                  rows={4}
                  value={(values.remarks ?? "") as string}
                  onChange={(event) => setField("remarks", event.target.value)}
                />
              ) : (
                <div className="min-h-24 rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3 text-[0.72rem] text-[var(--erp-muted)]">
                  {fieldDisplay(displayValues.remarks) === "-"
                    ? "No data available"
                    : fieldDisplay(displayValues.remarks)}
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-[0.72rem] font-semibold text-[var(--erp-ink)]">
                Pictures
              </label>
              <button
                type="button"
                className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-[var(--erp-border)] bg-white text-[0.7rem] font-medium text-[var(--erp-muted)]"
              >
                <Upload className="size-4" />
                Upload Image
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Info className="size-4 text-[var(--brand-secondary)]" />
              <h3 className="text-sm font-semibold text-[var(--erp-ink)]">Program Details</h3>
            </div>
            <div className="text-right">
              <p className="text-[0.55rem] font-bold text-[var(--erp-muted)]">Planting Week</p>
              <p className="text-2xl font-bold leading-none text-primary">{plantingWeekValue}</p>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 text-[0.62rem] font-bold text-[var(--erp-muted)]">
                Customer Directives
              </p>
              <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-info-muted)] px-4 py-3 text-[0.72rem] leading-6 text-[var(--erp-ink)]">
                {customerDirectives ?? "No data available"}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[0.62rem] font-bold text-[var(--erp-muted)]">
                General Remarks
              </p>
              <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3 text-[0.72rem] italic leading-6 text-[var(--erp-ink)]">
                {fieldDisplay(displayValues.remarks) === "-"
                  ? "No data available"
                  : fieldDisplay(displayValues.remarks)}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[0.62rem] font-bold text-[var(--erp-muted)]">
                Recommendations
              </p>
              {editing ? (
                <Textarea
                  className="rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
                  rows={4}
                  value={(values.recommendations ?? "") as string}
                  onChange={(event) => setField("recommendations", event.target.value)}
                />
              ) : (
                <>
                  {recommendationsList.length === 0 ? (
                    <p className="text-[0.72rem] text-[var(--erp-muted)]">No data available</p>
                  ) : (
                    <ul className="space-y-2 text-[0.72rem] leading-6 text-[var(--erp-ink)]">
                      {recommendationsList.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[0.875rem] border border-[#bfe6cf] bg-[#ebfaf0] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary text-white">
              <CircleAlert className="size-5" />
            </span>
            <div>
              <p className="text-[0.58rem] font-bold text-primary">Total Capacity Utilization</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-3xl font-bold leading-none text-[var(--erp-ink)]">
                  {utilization.value}
                </p>
                <span className="text-[0.7rem] font-semibold text-primary">{utilization.note}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function PollinationField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-[0.68rem] font-medium text-[var(--erp-ink)]">{label}</p>
      <div className="min-h-8">{value}</div>
    </div>
  );
}

function PollinationMetricBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2">
      <p className="text-[0.62rem] font-medium text-[var(--erp-muted)]">{label}</p>
      <div className="mt-2 text-[0.78rem] font-semibold text-[var(--erp-ink)]">{value}</div>
    </div>
  );
}

function ProdValueRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_5.25rem] items-center gap-3">
      <span className="text-[0.72rem] text-[var(--erp-ink)]">{label}</span>
      <div className="min-w-0">{value}</div>
    </div>
  );
}

function prodTextOrFallback(value: unknown) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function prodListOrFallback(value: unknown) {
  const text = prodTextOrFallback(value);
  if (!text) return null;
  return text
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function prodDisplayPlantingWeek(value: unknown) {
  const week = toNum(value);
  return week === null ? "W--" : `W${Math.round(week)}`;
}

function prodUtilization(values: Vals, nursery: Vals | null) {
  const realized = toNum(values.realizedPlants);
  const planted = toNum(nursery?.femaleActualPlantsPlanted);
  const ratio =
    realized !== null && planted !== null && planted > 0 ? (realized / planted) * 100 : null;

  return {
    value: ratio === null ? "-" : `${ratio.toFixed(1)}%`,
    note: "Database values",
  };
}

// ---- Pollination ----
export function PollinationForm({
  cropDataId,
  farmId,
  initial,
  production,
}: BaseProps & { production: Vals | null }) {
  const mutation = useUpdateSection(cropDataId, farmId, "pollination");
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(initial ?? {});

  function startEdit() {
    setValues({
      ...(initial ?? {}),
      pollinationStart: dateInputValue(initial?.pollinationStart),
      pollinationEnd: dateInputValue(initial?.pollinationEnd),
      expectedHarvestDate: dateInputValue(initial?.expectedHarvestDate),
    });
    setEditing(true);
  }

  function setField(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function savePollination() {
    const payload = {
      pollinationStart: values.pollinationStart || null,
      pollinationEnd: values.pollinationEnd || null,
      supervisor: values.supervisor === "" ? null : values.supervisor,
      avgSeedsPerFruit: parseNumberValue(values.avgSeedsPerFruit),
      fruitsPerPlant: parseNumberValue(values.fruitsPerPlant),
      seedsPerGram: parseNumberValue(values.seedsPerGram),
      expectedHarvestDate: values.expectedHarvestDate || null,
      avgTempDuringPollination: parseNumberValue(values.avgTempDuringPollination),
      lightDuringPollination: parseNumberValue(values.lightDuringPollination),
      avgHumidityDuringPollination: parseNumberValue(values.avgHumidityDuringPollination),
      remarks: values.remarks === "" ? null : values.remarks,
      recommendations: values.recommendations === "" ? null : values.recommendations,
    };
    const parsed = UpdatePollinationInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted pollination fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Pollination Lifecycle saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save pollination lifecycle.");
    }
  }

  const displayValues = editing ? values : (initial ?? {});
  const estimatedYield = pollinationEstimatedYield(displayValues, production ?? {});
  const customerDirectives =
    prodTextOrFallback(production?.remarksFromCustomer) ??
    prodTextOrFallback(displayValues.remarks);
  const generalRemarks = prodTextOrFallback(displayValues.remarks);
  const recommendationsList = prodListOrFallback(displayValues.recommendations) ?? [];
  const capacityUtilization = toNum(production?.realizedPlantsPerSqm);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(12rem,1fr)]">
      <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--erp-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <h3 className="text-sm font-semibold text-[var(--erp-ink)]">Pollination Overview</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={startEdit}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={savePollination}
              disabled={!editing || mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[0.75rem] border border-[var(--erp-border)]">
            <div className="border-b border-[var(--erp-border)] px-4 py-3">
              <p className="text-[0.62rem] font-bold text-[var(--erp-ink)]">Timeline & Yield</p>
            </div>
            <div className="grid gap-x-6 gap-y-4 p-4 md:grid-cols-2">
              <PollinationField
                label="Pollination Start"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="date"
                      value={(values.pollinationStart ?? "") as string}
                      onChange={(event) => setField("pollinationStart", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {formatDateDisplay(displayValues.pollinationStart as string) || "-"}
                    </span>
                  )
                }
              />
              <PollinationField
                label="Pollination End"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="date"
                      value={(values.pollinationEnd ?? "") as string}
                      onChange={(event) => setField("pollinationEnd", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {formatDateDisplay(displayValues.pollinationEnd as string) || "-"}
                    </span>
                  )
                }
              />
              <PollinationField
                label="Estimated Yield"
                value={
                  <span className="font-semibold text-[var(--erp-ink)]">
                    {fmtNum(estimatedYield)}
                  </span>
                }
              />
              <PollinationField
                label="Expected Harvest Date"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="date"
                      value={(values.expectedHarvestDate ?? "") as string}
                      onChange={(event) => setField("expectedHarvestDate", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {formatDateDisplay(displayValues.expectedHarvestDate as string) || "-"}
                    </span>
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-[0.75rem] border border-[var(--erp-border)]">
            <div className="border-b border-[var(--erp-border)] px-4 py-3">
              <p className="text-[0.62rem] font-bold text-[var(--erp-ink)]">Operational Data</p>
            </div>
            <div className="grid gap-x-6 gap-y-4 p-4 md:grid-cols-2">
              <PollinationField
                label="Pollination Supervisor in charge"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      value={(values.supervisor ?? "") as string}
                      onChange={(event) => setField("supervisor", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {fieldDisplay(displayValues.supervisor)}
                    </span>
                  )
                }
              />
              <PollinationField
                label="Avg. seeds/fruit"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="number"
                      step="any"
                      value={numberInputValue(values.avgSeedsPerFruit)}
                      onChange={(event) => setField("avgSeedsPerFruit", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {fieldDisplay(displayValues.avgSeedsPerFruit)}
                    </span>
                  )
                }
              />
              <PollinationField
                label="fruits/plant"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="number"
                      step="any"
                      value={numberInputValue(values.fruitsPerPlant)}
                      onChange={(event) => setField("fruitsPerPlant", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {fieldDisplay(displayValues.fruitsPerPlant)}
                    </span>
                  )
                }
              />
              <PollinationField
                label="Number of seeds in one gram"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="number"
                      step="any"
                      value={numberInputValue(values.seedsPerGram)}
                      onChange={(event) => setField("seedsPerGram", event.target.value)}
                    />
                  ) : (
                    <span className="font-semibold text-[var(--erp-ink)]">
                      {fieldDisplay(displayValues.seedsPerGram)}
                    </span>
                  )
                }
              />
            </div>
          </div>

          <div className="rounded-[0.75rem] border border-[var(--erp-border)]">
            <div className="border-b border-[var(--erp-border)] px-4 py-3">
              <p className="text-[0.62rem] font-bold text-[var(--erp-ink)]">
                Environmental Conditions
              </p>
            </div>
            <div className="grid gap-4 p-4 md:grid-cols-3">
              <PollinationMetricBox
                label="Avg Temp (°C)"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="number"
                      step="any"
                      value={numberInputValue(values.avgTempDuringPollination)}
                      onChange={(event) => setField("avgTempDuringPollination", event.target.value)}
                    />
                  ) : (
                    <span>{fieldDisplay(displayValues.avgTempDuringPollination)}</span>
                  )
                }
              />
              <PollinationMetricBox
                label="Light (j/cm2)"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="number"
                      step="any"
                      value={numberInputValue(values.lightDuringPollination)}
                      onChange={(event) => setField("lightDuringPollination", event.target.value)}
                    />
                  ) : (
                    <span>{fieldDisplay(displayValues.lightDuringPollination)}</span>
                  )
                }
              />
              <PollinationMetricBox
                label="Avg. Humidity (%)"
                value={
                  editing ? (
                    <Input
                      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                      type="number"
                      step="any"
                      value={numberInputValue(values.avgHumidityDuringPollination)}
                      onChange={(event) =>
                        setField("avgHumidityDuringPollination", event.target.value)
                      }
                    />
                  ) : (
                    <span>{fieldDisplay(displayValues.avgHumidityDuringPollination)}</span>
                  )
                }
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_11.5rem]">
            <div className="rounded-[0.75rem] border border-[var(--erp-border)] p-4">
              <label className="mb-3 block text-[0.72rem] font-semibold text-[var(--erp-ink)]">
                Remarks
              </label>
              {editing ? (
                <Textarea
                  className="min-h-24 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
                  rows={4}
                  value={(values.remarks ?? "") as string}
                  onChange={(event) => setField("remarks", event.target.value)}
                />
              ) : (
                <div className="min-h-24 rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3 text-[0.72rem] text-[var(--erp-ink)]">
                  {fieldDisplay(displayValues.remarks)}
                </div>
              )}
            </div>

            <div className="rounded-[0.75rem] border border-[var(--erp-border)] p-4">
              <label className="mb-3 block text-[0.72rem] font-semibold text-[var(--erp-ink)]">
                Pictures
              </label>
              <button
                type="button"
                className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-[var(--erp-border)] bg-[#edf4ff] px-3 text-[0.68rem] font-semibold text-[var(--erp-ink)]"
              >
                <Upload className="size-5 text-[var(--brand-tertiary)]" />
                <span>Upload Image</span>
                <span className="text-[0.58rem] font-medium text-[var(--erp-muted)]">
                  PNG, JPG up to 10MB
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white p-4 shadow-sm">
          <div>
            <p className="mb-2 text-[0.62rem] font-bold text-[var(--erp-muted)]">
              Customer Directives
            </p>
            <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-info-muted)] px-4 py-3 text-[0.72rem] leading-6 text-[var(--erp-ink)]">
              {customerDirectives ?? "No data available"}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[0.62rem] font-bold text-[var(--erp-muted)]">General Remarks</p>
            <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3 text-[0.72rem] italic leading-6 text-[var(--erp-ink)]">
              {generalRemarks ?? "No data available"}
            </div>
          </div>

          <div className="mt-5">
            <p className="mb-2 text-[0.62rem] font-bold text-[var(--erp-muted)]">Recommendations</p>
            {editing ? (
              <Textarea
                className="rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
                rows={4}
                value={(values.recommendations ?? "") as string}
                onChange={(event) => setField("recommendations", event.target.value)}
              />
            ) : (
              <>
                {recommendationsList.length === 0 ? (
                  <p className="text-[0.72rem] text-[var(--erp-muted)]">No data available</p>
                ) : (
                  <ul className="space-y-2 text-[0.72rem] leading-6 text-[var(--erp-ink)]">
                    {recommendationsList.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </section>

        <section className="rounded-[0.875rem] border border-[#bfe6cf] bg-[#ebfaf0] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary text-white">
              <CircleAlert className="size-5" />
            </span>
            <div>
              <p className="text-[0.58rem] font-bold text-primary">Total Capacity Utilization</p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-3xl font-bold leading-none text-[var(--erp-ink)]">
                  {capacityUtilization === null ? "-" : `${capacityUtilization.toFixed(1)}%`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="border-b border-[var(--erp-border)] px-4 py-3">
            <p className="text-[0.62rem] font-bold text-[var(--erp-muted)]">Field Live Status</p>
          </div>
          <div className="h-40 bg-[linear-gradient(135deg,#d8f3dc_0%,#edf6ff_40%,#d6e9ff_100%)] p-4">
            <div className="flex h-full items-center justify-center rounded-md border border-dashed border-[var(--erp-border)] bg-white/60 text-center text-[0.72rem] font-medium text-[var(--erp-muted)]">
              No data available
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function LegacyPostHarvestForm({
  cropDataId,
  farmId,
  initial,
  context,
}: BaseProps & { context: Vals | null }) {
  const mutation = useUpdateSection(cropDataId, farmId, "post_harvest");
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(initial ?? {});

  function startEdit() {
    setValues({
      ...(initial ?? {}),
      harvestStartDate: dateInputValue(initial?.harvestStartDate),
      plannedShippingDate: dateInputValue(initial?.plannedShippingDate),
      actualShippingDate: dateInputValue(initial?.actualShippingDate),
    });
    setEditing(true);
  }

  function setField(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function savePostHarvest() {
    const payload = {
      harvestStartDate: values.harvestStartDate || null,
      harvestEndDate: parseNumberValue(values.harvestEndDate),
      plannedShippingDate: values.plannedShippingDate || null,
      actualShippingDate: values.actualShippingDate || null,
      totalNoOfHarvests: parseNumberValue(values.totalNoOfHarvests),
      totalKgs: parseNumberValue(values.totalKgs),
      netCropCycleWeeks: parseNumberValue(values.netCropCycleWeeks),
      germinationPct: parseNumberValue(values.germinationPct),
      remarks: values.remarks === "" ? null : values.remarks,
      recommendations: values.recommendations === "" ? null : values.recommendations,
    };
    const parsed = UpdatePostHarvestInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted post harvest fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Post Harvest saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save post harvest.");
    }
  }

  const displayValues = editing ? values : (initial ?? {});
  const computations = postHarvestComputations(displayValues, context ?? {});
  const timelineRows = [
    ["Harvest Start Date", "harvestStartDate", "date"],
    ["Harvest End Date", "harvestEndDate", "number"],
    ["Planned Shipping Date", "plannedShippingDate", "date"],
    ["Actual Shipping Date", "actualShippingDate", "date"],
  ] as const;
  const performanceRows = [
    ["Total No. of Harvests", fieldDisplay(displayValues.totalNoOfHarvests)],
    ["Total KGs", fieldDisplay(displayValues.totalKgs)],
    ["Actual Yield (%)", `${fmtNum(computations.actualYieldPct, 2)}%`],
    ["Grams per m²", fmtNum(computations.gramsPerSqm, 2)],
    ["Grams per Plant", fmtNum(computations.gramsPerPlant, 2)],
    ["Net Crop Cycle Weeks", fieldDisplay(displayValues.netCropCycleWeeks)],
    ["Actual Gr/m²/wk", fmtNum(computations.actualGrPerSqmWk, 2)],
    ["% Germination", `${fieldDisplay(displayValues.germinationPct)}%`],
  ];

  function renderPostHarvestInput(name: string, type: "date" | "number") {
    if (!editing) {
      const value = displayValues[name];
      return type === "date" ? formatDateDisplay(value as string) || "-" : fieldDisplay(value);
    }
    return (
      <Input
        className="h-8 max-w-48"
        type={type === "date" ? "date" : "number"}
        step={type === "number" ? "any" : undefined}
        value={(values[name] ?? "") as string}
        onChange={(event) => setField(name, event.target.value)}
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-4">
        {editing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-sm text-[0.65rem]"
              onClick={() => setEditing(false)}
            >
              <X className="mr-1.5 size-3.5" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 rounded-sm text-[0.65rem]"
              onClick={savePostHarvest}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-sm text-[0.65rem]"
            onClick={startEdit}
          >
            <Pencil className="mr-1.5 size-3.5" />
            Edit Details
          </Button>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)]">
        <div className="border border-[var(--erp-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-3 py-2">
            <h3 className="text-xs font-bold text-[var(--erp-ink)]">Harvest Timeline</h3>
            <Truck className="size-3.5 text-[var(--erp-muted)]" />
          </div>
          <table className="w-full text-[0.68rem]">
            <thead className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.56rem] text-[var(--erp-muted)]">
              <tr>
                <th className="px-3 py-2 text-left font-bold">Phase</th>
                <th className="px-3 py-2 text-left font-bold">Start/End</th>
                <th className="px-3 py-2 text-right font-bold">Total KG</th>
                <th className="px-3 py-2 text-right font-bold">Yield %</th>
              </tr>
            </thead>
            <tbody>
              {timelineRows.map(([phase, name, type]) => (
                <tr key={phase} className="border-b border-[var(--erp-border)] last:border-b-0">
                  <td className="px-3 py-2 font-semibold text-[var(--erp-ink)]">{phase}</td>
                  <td className="px-3 py-2 text-[var(--erp-ink)]">
                    {renderPostHarvestInput(name, type)}
                  </td>
                  <td className="px-3 py-2 text-right font-bold">-</td>
                  <td className="px-3 py-2 text-right font-bold text-[var(--brand-secondary)]">
                    -
                  </td>
                </tr>
              ))}
              <tr className="bg-[var(--erp-table-head)] font-bold">
                <td className="px-3 py-2">Aggregate</td>
                <td className="px-3 py-2">{fieldDisplay(displayValues.totalNoOfHarvests)} Days</td>
                <td className="px-3 py-2 text-right">{fieldDisplay(displayValues.totalKgs)}</td>
                <td className="px-3 py-2 text-right text-primary">
                  {fmtNum(computations.actualYieldPct, 1)}%
                </td>
              </tr>
            </tbody>
          </table>
          <div className="bg-primary px-3 py-3 text-white">
            <p className="text-[0.58rem] opacity-80">Total KGs</p>
            <div className="mt-1 flex justify-between text-sm font-bold">
              <span>{fieldDisplay(displayValues.totalKgs)} KG</span>
              <span>{fmtNum(computations.actualYieldPct, 1)}%</span>
            </div>
          </div>
        </div>

        <div className="border border-[var(--erp-border)] bg-white">
          <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-3 py-2">
            <h3 className="text-xs font-bold text-[var(--erp-ink)]">Harvest Summary</h3>
            <div className="flex gap-2">
              <button className="border border-[var(--erp-border)] px-2 py-1 text-[0.58rem] font-bold">
                Filter
              </button>
              <button className="border border-[var(--erp-border)] px-2 py-1 text-[0.58rem] font-bold">
                Export
              </button>
            </div>
          </div>
          <table className="w-full text-[0.68rem]">
            <thead className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.56rem] text-[var(--erp-muted)]">
              <tr>
                <th className="px-3 py-2 text-left font-bold">Date</th>
                <th className="px-3 py-2 text-left font-bold">Operator</th>
                <th className="px-3 py-2 text-left font-bold">Bin ID</th>
                <th className="px-3 py-2 text-right font-bold">Net Wt.</th>
                <th className="px-3 py-2 text-right font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-[var(--erp-muted)]">
                  No records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="border border-[var(--erp-border)] bg-white p-4">
          <h3 className="mb-3 text-xs font-bold text-[var(--erp-ink)]">
            Operational Recommendations
          </h3>
          <div className="space-y-3 text-[0.68rem]">
            {(prodListOrFallback(displayValues.recommendations) ?? []).length === 0 ? (
              <p className="text-[var(--erp-muted)]">No data available</p>
            ) : (
              (prodListOrFallback(displayValues.recommendations) ?? []).map((body, index) => (
                <div key={body} className="flex gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6rem] font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="text-[var(--erp-muted)]">{body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-[var(--erp-border)] bg-white p-4">
          <h3 className="text-xs font-bold text-[var(--erp-ink)]">Remarks & Observations</h3>
          {editing ? (
            <Textarea
              className="mt-3 min-h-28 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
              rows={4}
              value={(values.remarks ?? "") as string}
              onChange={(event) => setField("remarks", event.target.value)}
            />
          ) : (
            <div className="mt-3 min-h-28 bg-[var(--erp-table-head)] px-4 py-3 text-[0.68rem] italic leading-5 text-[var(--erp-ink)]">
              {fieldDisplay(displayValues.remarks)}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-[0.62rem] font-semibold text-[var(--erp-muted)]">
            <span>
              {displayValues.updatedAt
                ? `Updated ${formatDateDisplay(displayValues.updatedAt as string)}`
                : "No update metadata"}
            </span>
            <button type="button" onClick={startEdit} className="font-bold text-primary">
              Edit Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Truck className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold">Post Harvest</h3>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={savePostHarvest} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Details"}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Timeline Metric</th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">Date Value</th>
                </tr>
              </thead>
              <tbody>
                {timelineRows.map(([label, name, type]) => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{label}</td>
                    <td className="px-4 py-3 font-semibold">
                      {renderPostHarvestInput(name, type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <label className="text-sm font-semibold">
              Recommendations <span className="text-destructive">*</span>
            </label>
            {editing ? (
              <Textarea
                className="mt-2 border-emerald-100 bg-emerald-50/70"
                rows={4}
                value={(values.recommendations ?? "") as string}
                onChange={(event) => setField("recommendations", event.target.value)}
              />
            ) : (
              <div className="mt-2 min-h-24 rounded-md border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-900">
                {fieldDisplay(displayValues.recommendations)}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Performance Metric</th>
                <th className="px-4 py-3 text-left font-semibold text-primary">Value</th>
              </tr>
            </thead>
            <tbody>
              {performanceRows.map(([label, value]) => (
                <tr key={label} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium text-muted-foreground">{label}</td>
                  <td className="px-4 py-3 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LegacyPostHarvestSummaryForm({ cropDataId, farmId, initial }: BaseProps) {
  const mutation = useUpdateSection(cropDataId, farmId, "post_harvest_summary");
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(initial ?? {});

  function startEdit() {
    setValues({
      ...(initial ?? {}),
      date: dateInputValue(initial?.date),
    });
    setEditing(true);
  }

  function setField(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function saveSummary() {
    const payload = {
      date: values.date || null,
      kgs: parseNumberValue(values.kgs),
      germinationPct: parseNumberValue(values.germinationPct),
      remarks: values.remarks === "" ? null : values.remarks,
    };
    const parsed = UpdatePostHarvestSummaryInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted harvest summary fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Harvest summary saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save harvest summary.");
    }
  }

  const displayValues = editing ? values : (initial ?? {});

  return (
    <div className="border border-[var(--erp-border)] bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--erp-ink)]">Add Operational Note</h3>
          <p className="text-[0.68rem] text-[var(--erp-muted)]">
            Capture a daily harvest summary, germination signal, and remarks.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-sm text-[0.65rem]"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-7 rounded-sm text-[0.65rem]"
                onClick={saveSummary}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Saving..." : "Save Note"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 rounded-sm text-[0.65rem]"
              onClick={startEdit}
            >
              <Plus className="mr-1.5 size-3.5" />
              Add Operational Note
            </Button>
          )}
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <NoteField label="Date">
          {editing ? (
            <Input
              className="h-8 rounded-sm"
              type="date"
              value={(values.date ?? "") as string}
              onChange={(event) => setField("date", event.target.value)}
            />
          ) : (
            formatDateDisplay(displayValues.date as string) || "-"
          )}
        </NoteField>
        <NoteField label="KGs">
          {editing ? (
            <Input
              className="h-8 rounded-sm"
              type="number"
              step="any"
              value={numberInputValue(values.kgs)}
              onChange={(event) => setField("kgs", event.target.value)}
            />
          ) : (
            fieldDisplay(displayValues.kgs)
          )}
        </NoteField>
        <NoteField label="Germination %">
          {editing ? (
            <Input
              className="h-8 rounded-sm"
              type="number"
              step="any"
              value={numberInputValue(values.germinationPct)}
              onChange={(event) => setField("germinationPct", event.target.value)}
            />
          ) : (
            `${fieldDisplay(displayValues.germinationPct)}%`
          )}
        </NoteField>
      </div>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <h3 className="text-sm font-semibold">Harvest Summaries</h3>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={saveSummary} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="secondary" size="sm">
                <Plus className="mr-1.5 h-4 w-4" />
                Add Harvest
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={startEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="border-y bg-muted/40">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">KGs</th>
            <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
              Germination %
            </th>
            <th className="px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="px-4 py-3 font-semibold">
              {editing ? (
                <Input
                  className="h-8 max-w-40"
                  type="date"
                  value={(values.date ?? "") as string}
                  onChange={(event) => setField("date", event.target.value)}
                />
              ) : (
                formatDateDisplay(displayValues.date as string) || "-"
              )}
            </td>
            <td className="px-4 py-3 font-semibold">
              {editing ? (
                <Input
                  className="h-8 max-w-32"
                  type="number"
                  step="any"
                  value={numberInputValue(values.kgs)}
                  onChange={(event) => setField("kgs", event.target.value)}
                />
              ) : (
                fieldDisplay(displayValues.kgs)
              )}
            </td>
            <td className="px-4 py-3 font-semibold">
              {editing ? (
                <Input
                  className="h-8 max-w-32"
                  type="number"
                  step="any"
                  value={numberInputValue(values.germinationPct)}
                  onChange={(event) => setField("germinationPct", event.target.value)}
                />
              ) : (
                <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
                  {fieldDisplay(displayValues.germinationPct)}%
                </span>
              )}
            </td>
            <td className="px-4 py-3 text-right text-muted-foreground">
              <Pencil className="ml-auto h-4 w-4" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PostHarvestForm({
  cropDataId,
  farmId,
  initial,
  context,
}: BaseProps & { context: Vals | null }) {
  const mutation = useUpdateSection(cropDataId, farmId, "post_harvest");
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(initial ?? {});

  function startEdit() {
    setValues({
      ...(initial ?? {}),
      harvestStartDate: dateInputValue(initial?.harvestStartDate),
      plannedShippingDate: dateInputValue(initial?.plannedShippingDate),
      actualShippingDate: dateInputValue(initial?.actualShippingDate),
    });
    setEditing(true);
  }

  function setField(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function savePostHarvest() {
    const payload = {
      harvestStartDate: values.harvestStartDate || null,
      harvestEndDate: parseNumberValue(values.harvestEndDate),
      plannedShippingDate: values.plannedShippingDate || null,
      actualShippingDate: values.actualShippingDate || null,
      totalNoOfHarvests: parseNumberValue(values.totalNoOfHarvests),
      totalKgs: parseNumberValue(values.totalKgs),
      netCropCycleWeeks: parseNumberValue(values.netCropCycleWeeks),
      germinationPct: parseNumberValue(values.germinationPct),
      remarks: values.remarks === "" ? null : values.remarks,
      recommendations: values.recommendations === "" ? null : values.recommendations,
    };
    const parsed = UpdatePostHarvestInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted post harvest fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Post Harvest saved");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save post harvest.");
    }
  }

  const displayValues = editing ? values : (initial ?? {});
  const computations = postHarvestComputations(displayValues, context ?? {});
  const startReference = formatDateDisplay(displayValues.harvestStartDate as string) || "-";
  const plannedReference = formatDateDisplay(displayValues.plannedShippingDate as string) || "-";
  const actualShippingValue = formatDateDisplay(displayValues.actualShippingDate as string) || "-";

  return (
    <section className="overflow-hidden rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center rounded-sm border border-primary text-primary">
            <span className="block size-1.5 rounded-full bg-primary" />
          </span>
          <h3 className="text-sm font-semibold text-[var(--erp-ink)]">Primary Metrics</h3>
        </div>
        {!editing ? (
          <Button type="button" variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
        ) : null}
      </div>

      <div className="space-y-4 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <PostHarvestMetricField
            label="Harvesting Start *"
            reference={startReference}
            value={
              editing ? (
                <Input
                  className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                  type="date"
                  value={(values.harvestStartDate ?? "") as string}
                  onChange={(event) => setField("harvestStartDate", event.target.value)}
                />
              ) : (
                <span>{startReference}</span>
              )
            }
          />
          <PostHarvestMetricField
            label="Harvesting End *"
            value={
              editing ? (
                <Input
                  className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                  type="number"
                  step="1"
                  value={numberInputValue(values.harvestEndDate)}
                  onChange={(event) => setField("harvestEndDate", event.target.value)}
                />
              ) : (
                <span>{fieldDisplay(displayValues.harvestEndDate)}</span>
              )
            }
          />
          <PostHarvestMetricField
            label="Number Of Harvests"
            value={
              editing ? (
                <Input
                  className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                  type="number"
                  step="1"
                  value={numberInputValue(values.totalNoOfHarvests)}
                  onChange={(event) => setField("totalNoOfHarvests", event.target.value)}
                />
              ) : (
                <span>{fieldDisplay(displayValues.totalNoOfHarvests)}</span>
              )
            }
          />
          <PostHarvestMetricField
            label="Planned Shipping Date"
            reference={plannedReference}
            value={
              editing ? (
                <Input
                  className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                  type="date"
                  value={(values.plannedShippingDate ?? "") as string}
                  onChange={(event) => setField("plannedShippingDate", event.target.value)}
                />
              ) : (
                <span>{plannedReference}</span>
              )
            }
          />
        </div>

        <div className="space-y-2">
          <p className="text-[0.68rem] font-medium text-[var(--erp-ink)]">Actual Shipping Date *</p>
          {editing ? (
            <Input
              className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
              type="date"
              value={(values.actualShippingDate ?? "") as string}
              onChange={(event) => setField("actualShippingDate", event.target.value)}
            />
          ) : (
            <div className="rounded-sm border border-[var(--erp-border)] bg-white px-3 py-2 text-[0.78rem] font-semibold text-[var(--erp-ink)]">
              {actualShippingValue}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <PostHarvestMetricField
            label="Actual Yield Achieved %"
            value={<span>{fmtNum(computations.actualYieldPct, 2)}</span>}
          />
          <PostHarvestMetricField
            label="Grams per m2"
            value={<span>{fmtNum(computations.gramsPerSqm, 2)}</span>}
          />
          <PostHarvestMetricField
            label="Grams per Plant"
            value={<span>{fmtNum(computations.gramsPerPlant, 2)}</span>}
          />
          <PostHarvestMetricField
            label="Net Crop Cycle Weeks"
            value={
              editing ? (
                <Input
                  className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.78rem]"
                  type="number"
                  step="any"
                  value={numberInputValue(values.netCropCycleWeeks)}
                  onChange={(event) => setField("netCropCycleWeeks", event.target.value)}
                />
              ) : (
                <span>{fieldDisplay(displayValues.netCropCycleWeeks)}</span>
              )
            }
          />
        </div>

        <PostHarvestMetricField
          label="Gr/m2/wk (Actual)"
          value={<span>{fmtNum(computations.actualGrPerSqmWk, 2)}</span>}
        />

        <div className="rounded-[0.75rem] border border-[var(--erp-border)] p-4">
          <p className="mb-3 text-[0.68rem] font-medium text-[var(--erp-ink)]">Remarks</p>
          {editing ? (
            <Textarea
              className="min-h-24 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
              rows={4}
              value={(values.remarks ?? "") as string}
              onChange={(event) => setField("remarks", event.target.value)}
            />
          ) : (
            <div className="min-h-24 rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3 text-[0.72rem] text-[var(--erp-ink)]">
              {fieldDisplay(displayValues.remarks)}
            </div>
          )}
        </div>

        <div className="rounded-[0.75rem] border border-[var(--erp-border)] p-4">
          <p className="mb-3 text-[0.68rem] font-medium text-[var(--erp-ink)]">Recommendations</p>
          {editing ? (
            <Textarea
              className="min-h-24 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-xs"
              rows={4}
              value={(values.recommendations ?? "") as string}
              onChange={(event) => setField("recommendations", event.target.value)}
            />
          ) : (
            <div className="min-h-24 rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3 text-[0.72rem] text-[var(--erp-ink)]">
              {fieldDisplay(displayValues.recommendations)}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--erp-border)] pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing(false)}
            disabled={!editing || mutation.isPending}
          >
            <X className="mr-1.5 h-4 w-4" />
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={savePostHarvest}
            disabled={!editing || mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Post-Harvest Data"}
          </Button>
        </div>
      </div>
    </section>
  );
}

export function PostHarvestSummaryForm({ cropDataId, farmId, initial }: BaseProps) {
  const mutation = useUpdateSection(cropDataId, farmId, "post_harvest_summary");
  const [values, setValues] = useState<Vals>({
    ...(initial ?? {}),
    date: dateInputValue(initial?.date),
  });

  function setField(name: string, value: unknown) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function saveSummary() {
    const payload = {
      date: values.date || null,
      kgs: parseNumberValue(values.kgs),
      germinationPct: parseNumberValue(values.germinationPct),
      remarks: values.remarks === "" ? null : values.remarks,
    };
    const parsed = UpdatePostHarvestSummaryInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("Please fix the highlighted harvest summary fields.");
      return;
    }
    try {
      await mutation.mutateAsync(parsed.data);
      toast.success("Harvest summary saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save harvest summary.");
    }
  }

  const totalKgs = parseNumberValue(values.kgs) ?? 0;
  const totalGermination = parseNumberValue(values.germinationPct) ?? 0;

  return (
    <section className="overflow-hidden rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--erp-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-4 items-center justify-center rounded-sm border border-[var(--brand-secondary)] text-[var(--brand-secondary)]">
            <span className="block size-1.5 rounded-full bg-[var(--brand-secondary)]" />
          </span>
          <h3 className="text-sm font-semibold text-[var(--erp-ink)]">Post Harvest Summary</h3>
        </div>
        <button type="button" className="text-[0.62rem] font-semibold text-primary">
          Export Excel
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[0.72rem]">
          <thead className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
            <tr className="text-[0.58rem] font-bold text-[var(--erp-muted)]">
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">KGS</th>
              <th className="px-4 py-3 text-left">%Germination</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--erp-border)] align-top">
              <td className="px-4 py-3">
                <Input
                  className="h-8 min-w-32 rounded-sm border-[var(--erp-border)] bg-white text-[0.78rem]"
                  type="date"
                  value={(values.date ?? "") as string}
                  onChange={(event) => setField("date", event.target.value)}
                />
              </td>
              <td className="px-4 py-3">
                <Input
                  className="h-8 min-w-24 rounded-sm border-[var(--erp-border)] bg-white text-[0.78rem]"
                  type="number"
                  step="any"
                  value={numberInputValue(values.kgs)}
                  onChange={(event) => setField("kgs", event.target.value)}
                />
              </td>
              <td className="px-4 py-3">
                <Input
                  className="h-8 min-w-24 rounded-sm border-[var(--erp-border)] bg-white text-[0.78rem]"
                  type="number"
                  step="any"
                  value={numberInputValue(values.germinationPct)}
                  onChange={(event) => setField("germinationPct", event.target.value)}
                />
              </td>
              <td className="px-4 py-3 text-center">
                <button
                  type="button"
                  onClick={saveSummary}
                  disabled={mutation.isPending}
                  className="inline-flex size-8 items-center justify-center rounded-full border border-[var(--erp-border)] bg-[var(--erp-table-head)] text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Plus className="size-4" />
                </button>
              </td>
            </tr>
            <tr className="bg-[var(--erp-table-head)] font-semibold text-[var(--erp-ink)]">
              <td className="px-4 py-3 text-primary">Total</td>
              <td className="px-4 py-3">{totalKgs.toFixed(2)}</td>
              <td className="px-4 py-3">{totalGermination.toFixed(2)}</td>
              <td className="px-4 py-3" />
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PostHarvestMetricField({
  label,
  value,
  reference,
}: {
  label: string;
  value: ReactNode;
  reference?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[0.68rem] font-medium text-[var(--erp-ink)]">{label}</p>
        {reference ? (
          <span className="text-[0.62rem] font-medium text-[var(--erp-muted)]">({reference})</span>
        ) : null}
      </div>
      <div className="min-h-8 rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--erp-ink)]">
        {value}
      </div>
    </div>
  );
}

function NoteField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border border-[var(--erp-border)] bg-[var(--erp-table-head)] p-3">
      <p className="text-[0.6rem] font-bold text-[var(--erp-muted)]">{label}</p>
      <div className="mt-2 text-sm font-bold text-[var(--erp-ink)]">{children}</div>
    </div>
  );
}

function EnvMetric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border border-[var(--erp-border)] bg-white p-3 text-center">
      <p className="text-[0.56rem] font-bold text-[var(--erp-muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold text-[var(--erp-ink)]">{value}</p>
      <p className="mt-1 text-[0.55rem] font-semibold text-primary">{note}</p>
    </div>
  );
}
