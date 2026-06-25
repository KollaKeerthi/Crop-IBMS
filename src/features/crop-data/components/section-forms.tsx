"use client";

import { useMemo, useState } from "react";
import { Activity, Flower2, Pencil, Sprout, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateDisplay } from "@/lib/format";
import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import {
  UpdateProductionInputSchema,
  UpdatePollinationInputSchema,
  UpdatePostHarvestInputSchema,
  UpdatePostHarvestSummaryInputSchema,
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
            <p className="text-sm text-muted-foreground">
              Manage crop cycle production metrics and environmental data.
            </p>
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
    </div>
  );
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
  const pollinationRows = [
    ["Pollination Start", "pollinationStart", "date"],
    ["Pollination End", "pollinationEnd", "date"],
    ["Supervisor", "supervisor", "text"],
    ["Avg Seeds / Fruit", "avgSeedsPerFruit", "number"],
    ["Fruits / Plant", "fruitsPerPlant", "number"],
    ["Seeds / Gram", "seedsPerGram", "number"],
    ["Exp. Harvest Date", "expectedHarvestDate", "date"],
  ] as const;
  const climateRows = [
    ["Avg. Temp During Pollination", "avgTempDuringPollination"],
    ["Light (J/cm2) During Pollination", "lightDuringPollination"],
    ["Avg. Humidity During Pollination", "avgHumidityDuringPollination"],
  ] as const;
  const estimatedYield = pollinationEstimatedYield(displayValues, production ?? {});

  function renderPollinationCell(name: string, type: "date" | "number" | "text") {
    if (!editing) {
      const value = displayValues[name];
      return type === "date" ? formatDateDisplay(value as string) || "-" : fieldDisplay(value);
    }
    if (type === "date") {
      return (
        <Input
          className="h-8 max-w-48"
          type="date"
          value={(values[name] ?? "") as string}
          onChange={(event) => setField(name, event.target.value)}
        />
      );
    }
    if (type === "number") {
      return (
        <Input
          className="h-8 max-w-48"
          type="number"
          step="any"
          value={numberInputValue(values[name])}
          onChange={(event) => setField(name, event.target.value)}
        />
      );
    }
    return (
      <Input
        className="h-8 max-w-48"
        value={(values[name] ?? "") as string}
        onChange={(event) => setField(name, event.target.value)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-primary/10 p-2 text-primary">
            <Flower2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Pollination Lifecycle</h3>
            <p className="text-sm text-muted-foreground">
              Manage yield estimation and environmental tracking.
            </p>
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={savePollination} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Lifecycle"}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit Lifecycle
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(22rem,0.95fr)]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Metric Definition</th>
                  <th className="px-4 py-3 text-left font-semibold text-primary">
                    Operational Baseline
                  </th>
                </tr>
              </thead>
              <tbody>
                {pollinationRows.map(([label, name, type]) => (
                  <tr key={name} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium text-muted-foreground">{label}</td>
                    <td className="px-4 py-3 font-semibold">{renderPollinationCell(name, type)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="px-4 py-3 font-medium text-muted-foreground">Estimated Yield</td>
                  <td className="px-4 py-3 font-semibold">{fmtNum(estimatedYield)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold">General Remarks</h3>
            {editing ? (
              <Textarea
                rows={3}
                value={(values.remarks ?? "") as string}
                onChange={(event) => setField("remarks", event.target.value)}
              />
            ) : (
              <div className="min-h-20 rounded-md border px-4 py-3 text-sm">
                {fieldDisplay(displayValues.remarks)}
              </div>
            )}
          </div>
        </div>

        <div className="h-fit rounded-lg border bg-card p-4">
          <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-5">
            <div className="h-24 rounded-lg border border-dashed bg-muted/30" />
            <div className="space-y-3">
              {climateRows.map(([label, name]) => (
                <div key={name} className="grid grid-cols-[1fr_5rem] items-center gap-3">
                  <span className="truncate font-semibold" title={label}>
                    {label}
                  </span>
                  {editing ? (
                    <Input
                      className="h-8"
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
      </div>
    </div>
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
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).actualYieldPct, 1),
  },
  {
    kind: "computed",
    label: "Grams per m2",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).gramsPerSqm, 2),
  },
  {
    kind: "computed",
    label: "Grams per Plant",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).gramsPerPlant, 2),
  },
  {
    kind: "computed",
    label: "Net Crop Cycle Weeks",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).netWeeks, 0),
  },
  {
    kind: "computed",
    label: "Actual Gr/m2/wk",
    compute: (v, ctx) => fmtNum(postHarvestComputations(v, ctx).actualGrPerSqmWk, 2),
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
      description="Manage harvest timelines, yield performance, and recommendations."
      icon={<Truck className="h-4 w-4" />}
      editLabel="Edit Details"
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
      title="Harvest Summaries"
      icon={<Sprout className="h-4 w-4" />}
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
