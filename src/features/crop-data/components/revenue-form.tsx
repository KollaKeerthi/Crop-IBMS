"use client";

import { useMemo, useState } from "react";
import {
  BanknoteArrowUp,
  CalendarDays,
  Coins,
  DollarSign,
  FileSpreadsheet,
  MessageSquarePlus,
  PlusCircle,
  TrendingUp,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UpdateRevenueInputSchema, type UpdateRevenueInput } from "../schema";
import { useUpdateRevenue } from "../hooks";
import { revenueSide, toNum } from "../compute";

type Vals = Record<string, unknown>;
type FieldType = "number" | "int" | "textarea";

type FieldDef = {
  name: keyof UpdateRevenueInput;
  type: FieldType;
};

const FIELDS: FieldDef[] = [
  { name: "maleTotalWeeks", type: "int" },
  { name: "femaleTotalWeeks", type: "int" },
  { name: "maleAgreedUnitPrice", type: "number" },
  { name: "femaleAgreedUnitPrice", type: "number" },
  { name: "additionalRevenue", type: "number" },
  { name: "plannedRemarks", type: "textarea" },
  { name: "actualRemarks", type: "textarea" },
];

type Props = {
  cropDataId: string;
  farmId: string;
  revenue: Vals | null;
  programInfo: Vals | null;
};

export function RevenueForm({ cropDataId, farmId, revenue, programInfo }: Props) {
  const mutation = useUpdateRevenue(cropDataId, farmId);
  const buildState = useMemo(() => () => buildRevenueState(revenue), [revenue]);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Vals>(buildState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const displayValues = editing ? values : buildState();

  function startEdit() {
    setValues(buildState());
    setErrors({});
    setEditing(true);
  }

  function cancelEdit() {
    setValues(buildState());
    setErrors({});
    setEditing(false);
  }

  function setField(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    const payload = assembleRevenuePayload(values);
    const parsed = UpdateRevenueInputSchema.safeParse(payload);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    await mutation.mutateAsync(parsed.data);
    toast.success("Revenue Projections saved");
    setEditing(false);
  }

  const planned = revenueSide(displayValues, programInfo, "male");
  const actual = revenueSide(displayValues, programInfo, "female");
  const variance = buildVarianceMetrics(displayValues, programInfo);
  const trendBars = buildTrendBars(planned.totalRevenue, actual.totalRevenue);
  const hasRemarks = Boolean(displayValues.actualRemarks || displayValues.plannedRemarks);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,2.05fr)_minmax(13rem,1fr)]">
      <section className="overflow-hidden rounded-md border border-[var(--erp-border)] bg-white shadow-sm">
        <div className="border-t-2 border-primary" />
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
              <th className="w-[48%] px-4 py-3 text-left text-[0.62rem] font-bold text-[var(--erp-muted)]">
                Revenue Category
              </th>
              <th className="w-[17%] px-3 py-3 text-center text-[0.62rem] font-bold text-[var(--erp-muted)]">
                Planned
              </th>
              <th className="w-[17%] px-3 py-3 text-center text-[0.62rem] font-bold text-[var(--erp-muted)]">
                Actual
              </th>
              <th className="w-[18%] px-3 py-3 text-center text-[0.62rem] font-bold text-[var(--erp-muted)]">
                Variance
              </th>
            </tr>
          </thead>
          <tbody>
            <RevenueMetricRow
              icon={<CalendarDays className="size-4 text-[var(--brand-secondary)]" />}
              label="Total Number of Weeks"
              hint="Production cycle duration"
              planned={renderEditableValue({
                editing,
                name: "maleTotalWeeks",
                type: "int",
                value: displayValues.maleTotalWeeks,
                error: errors.maleTotalWeeks,
                onFieldChange: setField,
              })}
              actual={renderEditableValue({
                editing,
                name: "femaleTotalWeeks",
                type: "int",
                value: displayValues.femaleTotalWeeks,
                error: errors.femaleTotalWeeks,
                onFieldChange: setField,
              })}
              variance={renderVariance(variance.totalWeeks)}
            />

            <RevenueMetricRow
              icon={<DollarSign className="size-4 text-[#4f7cff]" />}
              label="Agreed Unit Price (£/m2)"
              hint="Average rate per unit"
              planned={renderEditableValue({
                editing,
                name: "maleAgreedUnitPrice",
                type: "number",
                value: displayValues.maleAgreedUnitPrice,
                error: errors.maleAgreedUnitPrice,
                onFieldChange: setField,
              })}
              actual={renderEditableValue({
                editing,
                name: "femaleAgreedUnitPrice",
                type: "number",
                value: displayValues.femaleAgreedUnitPrice,
                error: errors.femaleAgreedUnitPrice,
                onFieldChange: setField,
              })}
              variance={renderVariance(variance.unitPrice)}
            />

            <RevenueMetricRow
              icon={<FileSpreadsheet className="size-4 text-[#4caf50]" />}
              label="Contract Revenue (£)"
              hint="Fixed quota revenue"
              planned={renderStaticValue(planned.contractRevenue)}
              actual={renderStaticValue(actual.contractRevenue)}
              variance={renderVariance(variance.contractRevenue)}
            />

            <RevenueMetricRow
              icon={<PlusCircle className="size-4 text-[#f97316]" />}
              label="Additional Revenue (£)"
              hint="Spot market sales"
              planned={renderStaticValue(0)}
              actual={renderEditableValue({
                editing,
                name: "additionalRevenue",
                type: "number",
                value: displayValues.additionalRevenue,
                error: errors.additionalRevenue,
                onFieldChange: setField,
                emphasize: true,
              })}
              variance={renderVariance(variance.additionalRevenue)}
            />

            <RevenueMetricRow
              emphasized
              icon={<BanknoteArrowUp className="size-4 text-white" />}
              label="Total Revenue (£)"
              hint="Gross aggregate for cycle"
              planned={renderStaticValue(planned.totalRevenue, true)}
              actual={renderStaticValue(actual.totalRevenue, true)}
              variance={renderVariance(variance.totalRevenue, true)}
            />

            <RevenueMetricRow
              icon={<Coins className="size-4 text-[#a855f7]" />}
              label="Total Revenue m2/wk"
              hint="Spatial and temporal efficiency"
              planned={renderStaticValue(planned.totalRevenuePerSqmWk)}
              actual={renderStaticValue(actual.totalRevenuePerSqmWk, true)}
              variance={renderVariance(variance.totalRevenuePerSqmWk)}
            />
          </tbody>
        </table>
      </section>

      <div className="space-y-4">
        <section className="rounded-md border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="space-y-3 p-3">
            {hasRemarks ? (
              <>
                {displayValues.actualRemarks ? (
                  <SystemNoteCard
                    title="Actual Remark"
                    body={String(displayValues.actualRemarks)}
                  />
                ) : null}
                {displayValues.plannedRemarks ? (
                  <SystemNoteCard
                    title="Planned Remark"
                    body={String(displayValues.plannedRemarks)}
                  />
                ) : null}
              </>
            ) : (
              <div className="border border-dashed border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-6 text-center text-[0.72rem] font-medium text-[var(--erp-muted)]">
                No data available
              </div>
            )}

            {editing ? (
              <div className="space-y-3 border border-[var(--erp-border)] p-3">
                <div>
                  <p className="mb-2 text-[0.7rem] font-bold text-[var(--erp-muted)]">
                    Planned Remark
                  </p>
                  <Textarea
                    value={(displayValues.plannedRemarks ?? "") as string}
                    rows={3}
                    onChange={(event) => setField("plannedRemarks", event.target.value)}
                  />
                  {errors.plannedRemarks ? (
                    <p className="mt-1 text-xs text-destructive">{errors.plannedRemarks}</p>
                  ) : null}
                </div>
                <div>
                  <p className="mb-2 text-[0.7rem] font-bold text-[var(--erp-muted)]">
                    Actual Remark
                  </p>
                  <Textarea
                    value={(displayValues.actualRemarks ?? "") as string}
                    rows={3}
                    onChange={(event) => setField("actualRemarks", event.target.value)}
                  />
                  {errors.actualRemarks ? (
                    <p className="mt-1 text-xs text-destructive">{errors.actualRemarks}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={editing ? undefined : startEdit}
              className="flex w-full items-center justify-center gap-2 border border-[var(--erp-border-strong)] bg-[var(--erp-table-head)] px-3 py-2 text-[0.76rem] font-semibold text-[var(--erp-ink)]"
            >
              <MessageSquarePlus className="size-4" />
              Add Remark
            </button>
          </div>
        </section>

        <section className="rounded-md border border-[var(--erp-border)] bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--erp-ink)]">Revenue Trends</h3>
            <TrendingUp className="size-4 text-[var(--brand-secondary)]" />
          </div>

          <div className="rounded-sm bg-[#eef3fb] px-4 pb-5 pt-4">
            {trendBars.length === 0 ? (
              <div className="flex h-28 items-center justify-center text-center text-[0.72rem] font-medium text-[var(--erp-muted)]">
                No data available
              </div>
            ) : (
              <div className="flex h-28 items-end justify-between gap-3">
                {trendBars.map((bar) => (
                  <div
                    key={bar.label}
                    className="flex flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div
                      className={
                        bar.active ? "w-full max-w-4 bg-[#0f5a7c]" : "w-full max-w-4 bg-[#9bd389]"
                      }
                      style={{ height: bar.height }}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center justify-between text-[0.6rem] font-semibold text-[var(--erp-muted)]">
              {trendBars.length === 0 ? (
                <span>No revenue values</span>
              ) : (
                trendBars.map((bar) => (
                  <span key={bar.label} className={bar.active ? "text-[#0f5a7c]" : undefined}>
                    {bar.label}
                  </span>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-md border border-[var(--erp-border)] bg-white px-3 py-3 shadow-sm">
          <div className="flex flex-wrap items-center justify-end gap-2">
            {editing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={cancelEdit}
                  disabled={mutation.isPending}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
                <Button variant="outline" size="sm" type="button">
                  Export to CSV
                </Button>
                <Button size="sm" type="button" onClick={save} disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" type="button">
                  Export to CSV
                </Button>
                <Button size="sm" type="button" onClick={startEdit}>
                  Edit Revenue
                </Button>
              </>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function buildRevenueState(revenue: Vals | null): Vals {
  const state: Vals = {};
  for (const field of FIELDS) state[field.name] = revenue?.[field.name] ?? "";
  return state;
}

function assembleRevenuePayload(values: Vals): UpdateRevenueInput {
  const payload: Vals = {};
  for (const field of FIELDS) {
    const value = values[field.name];
    if (field.type === "number" || field.type === "int") {
      payload[field.name] =
        value === "" || value === null || value === undefined ? null : Number(value);
    } else {
      payload[field.name] = value === "" ? null : value;
    }
  }
  return payload as UpdateRevenueInput;
}

function formatValue(value: unknown, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function calculateVariance(actual: unknown, planned: unknown): number | null {
  const actualNum = toNum(actual);
  const plannedNum = toNum(planned);
  if (actualNum === null || plannedNum === null) return null;
  return actualNum - plannedNum;
}

function buildVarianceMetrics(values: Vals, programInfo: Vals | null) {
  const planned = revenueSide(values, programInfo, "male");
  const actual = revenueSide(values, programInfo, "female");

  return {
    totalWeeks: calculateVariance(values.femaleTotalWeeks, values.maleTotalWeeks),
    unitPrice: calculateVariance(values.femaleAgreedUnitPrice, values.maleAgreedUnitPrice),
    contractRevenue: calculateVariance(actual.contractRevenue, planned.contractRevenue),
    additionalRevenue: toNum(values.additionalRevenue),
    totalRevenue: calculateVariance(actual.totalRevenue, planned.totalRevenue),
    totalRevenuePerSqmWk: calculateVariance(
      actual.totalRevenuePerSqmWk,
      planned.totalRevenuePerSqmWk
    ),
  };
}

function buildTrendBars(plannedTotal: number | null, actualTotal: number | null) {
  const values = [
    { label: "Planned", value: plannedTotal, active: false },
    { label: "Actual", value: actualTotal, active: true },
  ].filter(
    (item): item is { label: string; value: number; active: boolean } => item.value !== null
  );
  const max = Math.max(...values.map((item) => item.value), 0);
  if (max <= 0) return [];
  return values.map((item) => ({
    label: item.label,
    active: item.active,
    height: `${Math.max(8, Math.round((item.value / max) * 100))}%`,
  }));
}

function renderStaticValue(value: unknown, emphasize = false) {
  return (
    <span
      className={
        emphasize ? "font-bold text-[var(--erp-ink)]" : "font-medium text-[var(--erp-ink)]"
      }
    >
      {formatValue(value)}
    </span>
  );
}

function renderVariance(value: number | null, emphasize = false) {
  if (value === null) return <span className="font-medium text-[var(--erp-muted)]">-</span>;

  const tone =
    value > 0 ? "text-primary" : value < 0 ? "text-destructive" : "text-[var(--erp-muted)]";

  const prefix = value > 0 ? "+" : "";

  return (
    <span className={`${emphasize ? "font-bold" : "font-semibold"} ${tone}`}>
      {prefix}
      {formatValue(value)}
    </span>
  );
}

function renderEditableValue({
  editing,
  name,
  type,
  value,
  error,
  onFieldChange,
  emphasize = false,
}: {
  editing: boolean;
  name: keyof UpdateRevenueInput;
  type: "number" | "int";
  value: unknown;
  error?: string;
  onFieldChange: (name: string, value: string) => void;
  emphasize?: boolean;
}) {
  if (!editing) {
    return (
      <span
        className={
          emphasize
            ? "font-bold text-[var(--brand-secondary)]"
            : "font-medium text-[var(--erp-ink)]"
        }
      >
        {formatValue(value)}
      </span>
    );
  }

  return (
    <div>
      <Input
        className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-right text-[0.78rem] font-semibold"
        type="number"
        step={type === "int" ? 1 : "any"}
        value={(value ?? "") as string | number}
        onChange={(event) => onFieldChange(name, event.target.value)}
      />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function RevenueMetricRow({
  icon,
  label,
  hint,
  planned,
  actual,
  variance,
  emphasized = false,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  planned: React.ReactNode;
  actual: React.ReactNode;
  variance: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <tr
      className={
        emphasized
          ? "border-b border-[var(--erp-border)] bg-[#edf4ff] last:border-0"
          : "border-b border-[var(--erp-border)] last:border-0"
      }
    >
      <td className="px-4 py-3">
        <div className="flex items-start gap-3">
          <span
            className={
              emphasized
                ? "mt-0.5 flex size-7 shrink-0 items-center justify-center bg-primary text-white"
                : "mt-0.5 flex size-7 shrink-0 items-center justify-center bg-[var(--erp-table-head)]"
            }
          >
            {icon}
          </span>
          <div>
            <p
              className={
                emphasized
                  ? "font-bold text-[var(--erp-ink)]"
                  : "font-semibold text-[var(--erp-ink)]"
              }
            >
              {label}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-[var(--erp-muted)]">{hint}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3 text-right font-mono text-[0.82rem]">{planned}</td>
      <td className="px-3 py-3 text-right font-mono text-[0.82rem]">{actual}</td>
      <td className="px-3 py-3 text-right font-mono text-[0.82rem]">{variance}</td>
    </tr>
  );
}

function SystemNoteCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="border border-[var(--erp-border)] bg-[#fbfcfe] p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-bold text-[var(--erp-ink)]">{title}</p>
      </div>
      <p className="mt-2 text-[0.68rem] leading-5 text-[var(--erp-ink)]">{body}</p>
    </div>
  );
}
