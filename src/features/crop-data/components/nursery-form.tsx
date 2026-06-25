"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Mars, Pencil, Sprout, Venus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UpdateNurseryInputSchema, NURSERY_DATE_FIELDS, type UpdateNurseryInput } from "../schema";
import { useUpdateNursery } from "../hooks";
import { computeNurseryDerivedFields, toNum, fmtNum } from "../compute";

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
    toast.success("Nursery Operations saved");
    setEditing(false);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold tracking-tight">Nursery Operations</h3>
              <p className="text-sm text-muted-foreground">
                Manage early-stage planting and germination metrics.
              </p>
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={cancelEdit} disabled={mutation.isPending}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={save} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Operations
            </Button>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(24rem,1fr)]">
        <NurseryTable
          values={displayValues}
          editing={editing}
          errors={errors}
          programInfo={programInfo}
          onFieldChange={setField}
        />
        <NurseryContextPanel
          values={displayValues}
          editing={editing}
          errors={errors}
          onFieldChange={setField}
        />
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

function displayNumber(value: unknown, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function NurseryTable({
  values,
  editing,
  errors,
  programInfo,
  onFieldChange,
}: {
  values: Vals;
  editing: boolean;
  errors: Record<string, string>;
  programInfo: Vals | null;
  onFieldChange: (name: string, value: string) => void;
}) {
  const maleRows = deriveRows(values, "male");
  const femaleRows = deriveRows(values, "female");
  const maleArea = deriveSurface(values, programInfo, "male");
  const femaleArea = deriveSurface(values, programInfo, "female");

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="w-[34%] px-5 py-4 text-left font-bold text-slate-900">
              Metric Definition
            </th>
            <th className="w-[33%] px-5 py-4 text-left font-bold text-blue-600">
              <span className="inline-flex items-center gap-2">
                <Mars className="h-4 w-4" />
                Male Operations
              </span>
            </th>
            <th className="w-[33%] px-5 py-4 text-left font-bold text-pink-600">
              <span className="inline-flex items-center gap-2">
                <Venus className="h-4 w-4" />
                Female Operations
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <NurseryRow
            label="Actual Sowing Date"
            male={inputOrDisplay(
              values,
              editing,
              errors,
              "maleActualSowingDate",
              "date",
              onFieldChange
            )}
            female={inputOrDisplay(
              values,
              editing,
              errors,
              "femaleActualSowingDate",
              "date",
              onFieldChange
            )}
          />
          <NurseryRow
            label="Germination (%)"
            male={inputOrDisplay(
              values,
              editing,
              errors,
              "maleGerminationPct",
              "number",
              onFieldChange
            )}
            female={inputOrDisplay(
              values,
              editing,
              errors,
              "femaleGerminationPct",
              "number",
              onFieldChange
            )}
          />
          <NurseryRow
            label="Actual Planting Date"
            male={inputOrDisplay(
              values,
              editing,
              errors,
              "maleActualPlantingDate",
              "date",
              onFieldChange
            )}
            female={inputOrDisplay(
              values,
              editing,
              errors,
              "femaleActualPlantingDate",
              "date",
              onFieldChange
            )}
          />
          <NurseryRow
            label="Actual No. of Plants Planted"
            male={inputOrDisplay(
              values,
              editing,
              errors,
              "maleActualPlantsPlanted",
              "int",
              onFieldChange
            )}
            female={inputOrDisplay(
              values,
              editing,
              errors,
              "femaleActualPlantsPlanted",
              "int",
              onFieldChange
            )}
          />
          <NurseryRow
            label="Actual Plants / Row Planted"
            male={inputOrDisplay(
              values,
              editing,
              errors,
              "maleActualPlantsPerRow",
              "number",
              onFieldChange
            )}
            female={inputOrDisplay(
              values,
              editing,
              errors,
              "femaleActualPlantsPerRow",
              "number",
              onFieldChange
            )}
          />
          <NurseryRow
            label="Actual No. of Rows Planted"
            male={<strong>{fmtNum(maleRows)}</strong>}
            female={<strong>{fmtNum(femaleRows)}</strong>}
          />
          <NurseryRow
            label="Actual Surface Area Planted"
            male={<strong>{fmtNum(maleArea)}</strong>}
            female={<strong>{fmtNum(femaleArea)}</strong>}
          />
        </tbody>
      </table>
    </section>
  );
}

function inputOrDisplay(
  values: Vals,
  editing: boolean,
  errors: Record<string, string>,
  name: keyof UpdateNurseryInput,
  type: FieldType,
  onFieldChange: (name: string, value: string) => void
) {
  if (!editing) {
    const value = values[name];
    return <strong>{type === "date" ? displayDate(value) : displayNumber(value)}</strong>;
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

function NurseryRow({
  label,
  male,
  female,
}: {
  label: string;
  male: ReactNode;
  female: ReactNode;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-5 py-4 font-semibold text-muted-foreground">{label}</td>
      <td className="px-5 py-4">{male}</td>
      <td className="px-5 py-4">{female}</td>
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
      className="h-9"
      type={type === "date" ? "date" : "number"}
      step={type === "int" ? 1 : type === "number" ? "any" : undefined}
      value={(value ?? "") as string | number}
      onChange={(event) => onFieldChange(name, event.target.value)}
    />
  );
}

function NurseryContextPanel({
  values,
  editing,
  errors,
  onFieldChange,
}: {
  values: Vals;
  editing: boolean;
  errors: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="mb-6 grid grid-cols-[7.5rem_minmax(0,1fr)] gap-6">
        <div className="h-28 rounded-lg border border-dashed bg-muted/20" />
        <div>
          <div className="mb-2 text-sm font-bold text-slate-900">Actual Planting Week</div>
          {editing ? (
            <MetricInput
              name="actualPlantingWeek"
              type="int"
              value={values.actualPlantingWeek ?? ""}
              onFieldChange={onFieldChange}
            />
          ) : (
            <div className="rounded-md border bg-muted/20 px-4 py-3 font-bold">
              {displayNumber(values.actualPlantingWeek, 0)}
            </div>
          )}
          {errors.actualPlantingWeek ? (
            <p className="mt-1 text-xs text-destructive">{errors.actualPlantingWeek}</p>
          ) : null}
        </div>
      </div>

      <SideTextarea
        label="Customer Directives"
        name="remarksFromCustomer"
        placeholder="All Remarks from Customer"
        values={values}
        editing={editing}
        error={errors.remarksFromCustomer}
        onFieldChange={onFieldChange}
      />
      <SideTextarea
        label="Outbound Remarks"
        name="notes"
        placeholder="All Remarks to customer"
        values={values}
        editing={editing}
        error={errors.notes}
        onFieldChange={onFieldChange}
      />
      <SideTextarea
        label="Actionable Recommendations *"
        name="recommendations"
        placeholder="All Recommendations"
        values={values}
        editing={editing}
        error={errors.recommendations}
        onFieldChange={onFieldChange}
        tinted
      />
    </section>
  );
}

function SideTextarea({
  label,
  name,
  placeholder,
  values,
  editing,
  error,
  onFieldChange,
  tinted = false,
}: {
  label: string;
  name: "remarksFromCustomer" | "notes" | "recommendations";
  placeholder: string;
  values: Vals;
  editing: boolean;
  error?: string;
  onFieldChange: (name: string, value: string) => void;
  tinted?: boolean;
}) {
  const value = values[name];
  return (
    <div className="border-t py-5 first:border-t-0 first:pt-0">
      <div className="mb-2 text-sm font-bold text-slate-900">{label}</div>
      {editing ? (
        <>
          <MetricInput
            name={name}
            type="textarea"
            value={value ?? ""}
            onFieldChange={onFieldChange}
          />
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </>
      ) : (
        <div
          className={`min-h-22 rounded-md border px-4 py-4 text-sm ${
            tinted ? "bg-emerald-50 text-emerald-900" : "bg-muted/20 text-muted-foreground"
          }`}
        >
          {value ? String(value) : placeholder}
        </div>
      )}
    </div>
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
