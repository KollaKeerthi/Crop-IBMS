"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ImageUp,
  Images,
  Leaf,
  Sprout,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UpdateNurseryInputSchema, NURSERY_DATE_FIELDS, type UpdateNurseryInput } from "../schema";
import { useUpdateNursery } from "../hooks";
import { computeNurseryDerivedFields, toNum } from "../compute";

type Vals = Record<string, unknown>;
type FieldType = "date" | "number" | "int" | "textarea";

type FieldDef = {
  name: keyof UpdateNurseryInput;
  type: FieldType;
};

const FIELDS: FieldDef[] = [
  { name: "maleActualSowingDate", type: "date" },
  { name: "femaleActualSowingDate", type: "date" },
  { name: "maleGerminationPct", type: "number" },
  { name: "femaleGerminationPct", type: "number" },
  { name: "maleActualPlantingDate", type: "date" },
  { name: "femaleActualPlantingDate", type: "date" },
  { name: "actualPlantingWeek", type: "int" },
  { name: "maleActualPlantsPlanted", type: "int" },
  { name: "femaleActualPlantsPlanted", type: "int" },
  { name: "maleActualPlantsPerRow", type: "number" },
  { name: "femaleActualPlantsPerRow", type: "number" },
  { name: "remarksFromCustomer", type: "textarea" },
  { name: "notes", type: "textarea" },
  { name: "recommendations", type: "textarea" },
];

type Props = {
  cropDataId: string;
  farmId: string;
  nursery: Vals | null;
  programInfo: Vals | null;
};

export function NurseryForm({ cropDataId, farmId, nursery, programInfo }: Props) {
  const mutation = useUpdateNursery(cropDataId, farmId);
  const buildState = useMemo(
    () => () => computeNurseryDerivedFields(buildNurseryState(nursery), programInfo),
    [nursery, programInfo]
  );
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
    setValues((current) => computeNurseryDerivedFields({ ...current, [name]: value }, programInfo));
  }

  async function save() {
    const payload = assembleNurseryPayload(values);
    const parsed = UpdateNurseryInputSchema.safeParse(payload);
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
    toast.success("Nursery saved");
    setEditing(false);
  }

  const capacity = deriveCapacity(displayValues, programInfo);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(12rem,1fr)]">
        <section className="overflow-hidden rounded-[0.875rem] border border-[var(--erp-border)] bg-white shadow-sm">
          <table className="w-full table-fixed border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
                <th className="w-[50%] px-4 py-3 text-left text-[0.62rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]"></th>
                <th className="w-[25%] px-3 py-3 text-center text-[0.62rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                  Male
                </th>
                <th className="w-[25%] px-3 py-3 text-center text-[0.62rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
                  Female
                </th>
              </tr>
            </thead>
            <tbody>
              <NurseryMetricRow
                icon={<CalendarDays className="size-4 text-[var(--erp-muted)]" />}
                label="Actual Sowing Date"
                male={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "maleActualSowingDate",
                  type: "date",
                  onFieldChange: setField,
                })}
                female={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "femaleActualSowingDate",
                  type: "date",
                  onFieldChange: setField,
                })}
                maleMeta={buildPlannedDate(programInfo?.malePlannedSowingDate)}
                femaleMeta={buildPlannedDate(programInfo?.femalePlannedSowingDate)}
              />

              <NurseryMetricRow
                icon={<Images className="size-4 text-[var(--erp-muted)]" />}
                label="Germination %"
                male={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "maleGerminationPct",
                  type: "number",
                  onFieldChange: setField,
                  highlight: true,
                })}
                female={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "femaleGerminationPct",
                  type: "number",
                  onFieldChange: setField,
                  highlight: true,
                })}
              />

              <NurseryMetricRow
                icon={<CalendarDays className="size-4 text-[var(--erp-muted)]" />}
                label="Actual Planting Date"
                male={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "maleActualPlantingDate",
                  type: "date",
                  onFieldChange: setField,
                })}
                female={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "femaleActualPlantingDate",
                  type: "date",
                  onFieldChange: setField,
                })}
                maleMeta={buildPlannedDate(programInfo?.malePlannedPlantingDate)}
                femaleMeta={buildPlannedDate(programInfo?.femalePlannedPlantingDate)}
              />

              <NurseryMetricRow
                subtle
                label="Actual Planting Week"
                male={<span className="text-[var(--erp-muted)]">-</span>}
                female={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "actualPlantingWeek",
                  type: "int",
                  onFieldChange: setField,
                })}
              />

              <NurseryMetricRow
                icon={<Sprout className="size-4 text-[var(--erp-muted)]" />}
                label="Actual No. of Plants Planted"
                male={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "maleActualPlantsPlanted",
                  type: "int",
                  onFieldChange: setField,
                })}
                female={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "femaleActualPlantsPlanted",
                  type: "int",
                  onFieldChange: setField,
                })}
              />

              <NurseryMetricRow
                subtle
                label="Actual Plants / Row Planted"
                male={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "maleActualPlantsPerRow",
                  type: "number",
                  onFieldChange: setField,
                })}
                female={renderValueCell({
                  editing,
                  values: displayValues,
                  errors,
                  name: "femaleActualPlantsPerRow",
                  type: "number",
                  onFieldChange: setField,
                })}
              />

              <NurseryMetricRow
                subtle
                label="Actual No. of Rows Planted"
                male={renderStaticText(formatNumber(deriveRows(displayValues, "male")))}
                female={renderStaticText(formatNumber(deriveRows(displayValues, "female")))}
              />

              <NurseryMetricRow
                icon={<Leaf className="size-4 text-[var(--erp-muted)]" />}
                label="Actual Surface Area Planted (m²)"
                male={renderStaticText(
                  formatNumber(deriveSurface(displayValues, programInfo, "male"))
                )}
                female={renderStaticText(
                  formatNumber(deriveSurface(displayValues, programInfo, "female"))
                )}
              />

              <NurseryMetricRow
                alert
                icon={<AlertTriangle className="size-4 text-destructive" />}
                label="Re-sowing Requirement"
                male={renderStaticText(capacity.maleShortfall)}
                female={renderStaticText(capacity.femaleShortfall, true)}
              />
            </tbody>
          </table>
        </section>

        <div className="space-y-4">
          <NotesCard
            title="Remarks"
            editing={editing}
            value={(displayValues.remarksFromCustomer as string) ?? ""}
            error={errors.remarksFromCustomer}
            onChange={(next) => setField("remarksFromCustomer", next)}
            placeholder="No remarks added yet."
          />

          <NotesCard
            title="Recommendations"
            editing={editing}
            value={(displayValues.recommendations as string) ?? ""}
            error={errors.recommendations}
            onChange={(next) => setField("recommendations", next)}
            placeholder="No recommendations added yet."
            bulleted={!editing}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(12rem,1fr)]">
        <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--erp-ink)]">
              Documentation &amp; Pictures
            </h3>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[0.72rem] font-semibold text-[var(--brand-secondary)]"
            >
              <Upload className="size-4" />
              Upload New Image
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex h-20 flex-col items-center justify-center rounded-md border border-dashed border-[var(--erp-border)] bg-[var(--erp-table-head)] px-2 text-center"
              >
                <ImageUp className="mb-2 size-4 text-[var(--erp-muted)]" />
                <span className="text-[0.62rem] text-[var(--erp-muted)]">No images uploaded</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[0.875rem] border border-[#bfe6cf] bg-[#ebfaf0] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-primary text-white">
              <Leaf className="size-5" />
            </span>
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-wide text-primary">
                Total Capacity Utilization
              </p>
              <div className="mt-1 flex items-end gap-2">
                <p className="text-3xl font-bold leading-none text-[var(--erp-ink)]">
                  {capacity.utilization}
                </p>
                <span className="text-[0.7rem] font-semibold text-primary">+2.1% vs PW</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-2">
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
                <Button size="sm" type="button" onClick={save} disabled={mutation.isPending}>
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button size="sm" type="button" onClick={startEdit}>
                Edit Nursery
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function buildNurseryState(nursery: Vals | null): Vals {
  const state: Vals = {};
  for (const field of FIELDS) {
    const value = nursery?.[field.name];
    state[field.name] = field.type === "date" ? formatDateForInput(value) : (value ?? "");
  }
  return state;
}

function assembleNurseryPayload(values: Vals): UpdateNurseryInput {
  const dateSet = new Set<string>(NURSERY_DATE_FIELDS);
  const payload: Vals = {};
  for (const field of FIELDS) {
    const value = values[field.name];
    if (field.type === "number" || field.type === "int") {
      payload[field.name] =
        value === "" || value === null || value === undefined ? null : Number(value);
    } else if (dateSet.has(field.name) || field.type === "date") {
      payload[field.name] = value === "" || value === null || value === undefined ? null : value;
    } else {
      payload[field.name] = value === "" ? null : value;
    }
  }
  return payload as UpdateNurseryInput;
}

function formatDateForInput(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function displayDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB").replace(/\//g, "-");
}

function formatNumber(value: unknown, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function buildPlannedDate(value: unknown) {
  if (!value) return undefined;
  return `(${displayDate(value)})`;
}

function renderStaticText(value: string, highlight = false) {
  return (
    <span
      className={
        highlight ? "font-semibold text-destructive" : "font-semibold text-[var(--erp-ink)]"
      }
    >
      {value}
    </span>
  );
}

function renderValueCell({
  editing,
  values,
  errors,
  name,
  type,
  onFieldChange,
  highlight = false,
}: {
  editing: boolean;
  values: Vals;
  errors: Record<string, string>;
  name: keyof UpdateNurseryInput;
  type: FieldType;
  onFieldChange: (name: string, value: string) => void;
  highlight?: boolean;
}) {
  if (!editing) {
    const value = values[name];
    return (
      <span
        className={highlight ? "font-semibold text-primary" : "font-semibold text-[var(--erp-ink)]"}
      >
        {type === "date" ? displayDate(value) : formatNumber(value)}
      </span>
    );
  }

  return (
    <div>
      <MetricInput
        name={name}
        type={type}
        value={values[name] ?? ""}
        onFieldChange={onFieldChange}
      />
      {errors[name] ? <p className="mt-1 text-xs text-destructive">{errors[name]}</p> : null}
    </div>
  );
}

function NurseryMetricRow({
  icon,
  label,
  male,
  female,
  maleMeta,
  femaleMeta,
  subtle = false,
  alert = false,
}: {
  icon?: React.ReactNode;
  label: string;
  male: React.ReactNode;
  female: React.ReactNode;
  maleMeta?: string;
  femaleMeta?: string;
  subtle?: boolean;
  alert?: boolean;
}) {
  return (
    <tr
      className={
        alert
          ? "border-b border-[var(--erp-border)] bg-[#fff7f7] last:border-0"
          : "border-b border-[var(--erp-border)] last:border-0"
      }
    >
      <td
        className={`px-4 py-3 ${subtle ? "italic text-[var(--erp-muted)]" : "text-[var(--erp-ink)]"}`}
      >
        <div className="flex items-start gap-3">
          {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
          <span className={alert ? "text-destructive" : "font-medium"}>{label}</span>
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <div>{male}</div>
          {maleMeta ? (
            <span className="text-[0.58rem] text-[var(--erp-muted)]">{maleMeta}</span>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3 text-center">
        <div className="flex flex-col items-center gap-1">
          <div>{female}</div>
          {femaleMeta ? (
            <span className="text-[0.58rem] text-[var(--erp-muted)]">{femaleMeta}</span>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function MetricInput({
  name,
  type,
  value,
  onFieldChange,
}: {
  name: string;
  type: FieldType;
  value: unknown;
  onFieldChange: (name: string, value: string) => void;
}) {
  if (type === "textarea") {
    return (
      <Textarea
        value={(value ?? "") as string}
        rows={4}
        onChange={(event) => onFieldChange(name, event.target.value)}
      />
    );
  }

  return (
    <Input
      className="h-8 rounded-sm border-[var(--erp-border)] bg-[var(--erp-table-head)] text-center text-[0.78rem] font-semibold"
      type={type === "date" ? "date" : "number"}
      step={type === "int" ? 1 : type === "number" ? "any" : undefined}
      value={(value ?? "") as string | number}
      onChange={(event) => onFieldChange(name, event.target.value)}
    />
  );
}

function NotesCard({
  title,
  editing,
  value,
  error,
  onChange,
  placeholder,
  bulleted = false,
}: {
  title: string;
  editing: boolean;
  value: string;
  error?: string;
  onChange: (next: string) => void;
  placeholder: string;
  bulleted?: boolean;
}) {
  return (
    <section className="rounded-[0.875rem] border border-[var(--erp-border)] bg-white p-4 shadow-sm">
      <div className="mb-3 text-[0.7rem] font-bold uppercase tracking-wide text-[var(--erp-muted)]">
        {title}
      </div>
      {editing ? (
        <>
          <Textarea value={value} rows={6} onChange={(event) => onChange(event.target.value)} />
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </>
      ) : bulleted && value ? (
        <ul className="space-y-2 text-sm leading-6 text-[var(--erp-ink)]">
          {value
            .split(/\r?\n/)
            .map((item) => item.trim())
            .filter(Boolean)
            .map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
        </ul>
      ) : (
        <div className="rounded-md border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-4 text-sm italic leading-6 text-[var(--erp-muted)]">
          {value || placeholder}
        </div>
      )}
    </section>
  );
}

function deriveRows(values: Vals, side: "male" | "female") {
  const plants = toNum(values[`${side}ActualPlantsPlanted`]);
  const perRow = toNum(values[`${side}ActualPlantsPerRow`]);
  return plants === null || perRow === null || perRow === 0 ? null : plants / perRow;
}

function deriveSurface(values: Vals, programInfo: Vals | null, side: "male" | "female") {
  const plants = toNum(values[`${side}ActualPlantsPlanted`]);
  const density = toNum(programInfo?.[`${side}PlannedPlantsPerSqm`]);
  return plants === null || density === null || density === 0 ? null : plants / density;
}

function deriveShortfall(values: Vals, programInfo: Vals | null, side: "male" | "female") {
  const actual = toNum(values[`${side}ActualPlantsPlanted`]);
  const planned = toNum(programInfo?.[`${side}PlannedPlants`]);
  if (planned === null || actual === null) return "N/A";
  const delta = planned - actual;
  return delta > 0 ? `${formatNumber(delta, 0)} Units` : "N/A";
}

function deriveCapacity(values: Vals, programInfo: Vals | null) {
  const actualTotal =
    (toNum(values.maleActualPlantsPlanted) ?? 0) + (toNum(values.femaleActualPlantsPlanted) ?? 0);
  const plannedTotal =
    (toNum(programInfo?.malePlannedPlants) ?? 0) + (toNum(programInfo?.femalePlannedPlants) ?? 0);
  const utilization =
    plannedTotal > 0 ? `${((actualTotal / plannedTotal) * 100).toFixed(1)}%` : "0.0%";

  return {
    utilization,
    maleShortfall: deriveShortfall(values, programInfo, "male"),
    femaleShortfall: deriveShortfall(values, programInfo, "female"),
  };
}
