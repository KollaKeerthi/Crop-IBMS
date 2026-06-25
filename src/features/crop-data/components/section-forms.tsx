"use client";

import { useMemo, useState } from "react";
import { Activity, Flower2, Pencil, Plus, Sprout, Truck, X } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export function PostHarvestSummaryForm({ cropDataId, farmId, initial }: BaseProps) {
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
