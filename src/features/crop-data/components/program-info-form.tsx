"use client";

import type { FieldType, MetricRow, Vals } from "./metric-form";
import { useMemo, useState } from "react";
import { CalendarDays, Info, Mars, Pencil, Venus, X } from "lucide-react";
import { toast } from "sonner";
import {
  UpdateProgramInfoInputSchema,
  PROGRAM_INFO_DATE_FIELDS,
  type UpdateProgramInfoInput,
} from "../schema";
import { useUpdateProgramInfo } from "../hooks";
import { computeProgramInfoDerivedFields } from "../compute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const PLANNING_ROWS: MetricRow[] = [
  { kind: "mf", label: "Batch Number", type: "text", male: "maleBatchNo", female: "femaleBatchNo" },
  {
    kind: "mf",
    label: "Planned Sowing Date",
    type: "date",
    male: "malePlannedSowingDate",
    female: "femalePlannedSowingDate",
  },
  {
    kind: "mf",
    label: "Planned Planting Date",
    type: "date",
    male: "malePlannedPlantingDate",
    female: "femalePlannedPlantingDate",
  },
  {
    kind: "mf",
    label: "Planned No of Plants",
    type: "int",
    male: "malePlannedPlants",
    female: "femalePlannedPlants",
  },
  {
    kind: "mf",
    label: "Planned Plants / Row",
    type: "number",
    male: "malePlannedPlantsPerRow",
    female: "femalePlannedPlantsPerRow",
  },
  {
    kind: "mf",
    label: "Planned Plants / m²",
    type: "number",
    male: "malePlannedPlantsPerSqm",
    female: "femalePlannedPlantsPerSqm",
  },
  { kind: "single", label: "Planned Surface Area", type: "number", name: "plannedSurfaceArea" },
  { kind: "single", label: "Planned No of Rows", type: "int", name: "plannedNoOfRows" },
  {
    kind: "single",
    label: "Proposed gram / Plant (Customer)",
    type: "number",
    name: "proposedGramPerPlant",
  },
  { kind: "single", label: "Agreed gram / Plant", type: "number", name: "agreedGramPerPlant" },
  { kind: "single", label: "Base Yield (kg)", type: "number", name: "baseYieldKg" },
  { kind: "single", label: "grams / m2", type: "number", name: "gramsPerSqm" },
  {
    kind: "mf",
    label: "Requested Quantity",
    type: "number",
    male: "maleRequestedQuantity",
    female: "femaleRequestedQuantity",
  },
];

type ContextField = {
  label: string;
  name: keyof UpdateProgramInfoInput;
  type: "text" | "number" | "int" | "date" | "textarea";
};

const CONTEXT_FIELDS: ContextField[] = [
  {
    label: "Arrival Date (Actual)",
    type: "date",
    name: "materialArrivalDate",
  },
  { label: "Block Prep Start", type: "date", name: "blockPrepStartDate" },
  { label: "Block Prep End", type: "date", name: "blockPrepEndDate" },
  { label: "Reference Year", type: "int", name: "productionYear" },
  {
    label: "Agreed Order (kg)",
    type: "number",
    name: "agreedOrderFromCustomerKg",
  },
  {
    label: "Requested Delivery Date (Customer)",
    type: "date",
    name: "requestedDeliveryDate",
  },
  { label: "Archive Status", type: "text", name: "archiveStatus" },
  {
    label: "Remarks From Customer",
    type: "textarea",
    name: "remarksFromCustomer",
  },
  { label: "Notes", type: "textarea", name: "notes" },
];

type Props = {
  cropDataId: string;
  farmId: string;
  programInfo: Vals | null;
};

export function ProgramInfoForm({ cropDataId, farmId, programInfo }: Props) {
  const mutation = useUpdateProgramInfo(cropDataId, farmId);
  const fields = useMemo(() => editableFields([...PLANNING_ROWS, ...CONTEXT_FIELDS]), []);
  const buildState = useMemo(
    () => () => buildProgramState(programInfo, fields),
    [fields, programInfo]
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

  function setField(name: string, value: unknown) {
    setValues((current) => computeProgramInfoDerivedFields({ ...current, [name]: value }));
  }

  async function handleSave() {
    const payload = assembleProgramPayload(values, fields);
    const parsed = UpdateProgramInfoInputSchema.safeParse(payload);
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
    toast.success("Program Parameters saved");
    setEditing(false);
  }

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-600">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">Program Parameters</h3>
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={cancelEdit} disabled={mutation.isPending}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={startEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Parameters
            </Button>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(23rem,1fr)]">
        <ProgramParametersTable
          values={displayValues}
          saved={programInfo}
          editing={editing}
          errors={errors}
          onFieldChange={setField}
        />
        <TemporalContextCard
          values={displayValues}
          saved={programInfo}
          editing={editing}
          errors={errors}
          onFieldChange={setField}
        />
      </div>
    </div>
  );
}

type EditableField = { name: string; type: FieldType };

function editableFields(rows: Array<MetricRow | ContextField>): EditableField[] {
  const out: EditableField[] = [];
  for (const row of rows) {
    if ("kind" in row && row.kind === "mf") {
      out.push({ name: row.male, type: row.type }, { name: row.female, type: row.type });
    } else if ("kind" in row && row.kind === "single") {
      out.push({ name: row.name, type: row.type });
    } else if (!("kind" in row)) {
      out.push({ name: row.name, type: row.type });
    }
  }
  return out;
}

function buildProgramState(programInfo: Vals | null, fields: EditableField[]): Vals {
  const state: Vals = {};
  for (const field of fields) {
    const raw = programInfo?.[field.name];
    state[field.name] = field.type === "date" ? formatDateForInput(raw) : (raw ?? "");
  }
  return computeProgramInfoDerivedFields(state);
}

function assembleProgramPayload(values: Vals, fields: EditableField[]): UpdateProgramInfoInput {
  const dateSet = new Set<string>(PROGRAM_INFO_DATE_FIELDS);
  const payload: Vals = {};
  for (const field of fields) {
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
  return payload as UpdateProgramInfoInput;
}

function displayProgramValue(value: unknown, type: FieldType) {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "date") return formatDateForInput(value);
  if (type === "number") return formatNumber(value, 2);
  if (type === "int") return formatNumber(value, 0);
  return String(value);
}

function formatNumber(value: unknown, fractionDigits: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
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
  onFieldChange: (name: string, value: unknown) => void;
}) {
  if (type === "textarea") {
    return (
      <Textarea
        value={(value ?? "") as string}
        rows={3}
        onChange={(event) => onFieldChange(name, event.target.value)}
      />
    );
  }
  return (
    <Input
      className="h-9"
      type={type === "date" ? "date" : type === "text" ? "text" : "number"}
      step={type === "int" ? 1 : type === "number" ? "any" : undefined}
      value={(value ?? "") as string | number}
      onChange={(event) => onFieldChange(name, event.target.value)}
    />
  );
}

function ProgramParametersTable({
  values,
  saved,
  editing,
  errors,
  onFieldChange,
}: {
  values: Vals;
  saved: Vals | null;
  editing: boolean;
  errors: Record<string, string>;
  onFieldChange: (name: string, value: unknown) => void;
}) {
  function renderCell(name: string, type: FieldType) {
    if (!editing) {
      return (
        <span className="text-lg font-bold text-slate-900">
          {displayProgramValue(saved?.[name], type)}
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

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b bg-muted/30">
            <th className="w-[34%] px-5 py-4 text-left text-base font-bold text-slate-900">
              Metric Definition
            </th>
            <th className="w-[33%] px-5 py-4 text-left text-base font-bold text-cyan-700">
              <span className="inline-flex items-center gap-2">
                <Mars className="h-4 w-4" />
                Male Parent
              </span>
            </th>
            <th className="w-[33%] px-5 py-4 text-left text-base font-bold text-pink-600">
              <span className="inline-flex items-center gap-2">
                <Venus className="h-4 w-4" />
                Female Parent
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {PLANNING_ROWS.map((row) => {
            if (row.kind === "mf") {
              return (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="px-5 py-4 text-base font-semibold text-muted-foreground">
                    {row.label}
                  </td>
                  <td className="px-5 py-4">{renderCell(row.male, row.type)}</td>
                  <td className="px-5 py-4">{renderCell(row.female, row.type)}</td>
                </tr>
              );
            }
            if (row.kind === "single") {
              return (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="px-5 py-4 text-base font-semibold text-muted-foreground">
                    {row.label}
                  </td>
                  <td className="px-5 py-4" />
                  <td className="px-5 py-4">{renderCell(row.name, row.type)}</td>
                </tr>
              );
            }
            return null;
          })}
        </tbody>
      </table>
    </section>
  );
}

function TemporalContextCard({
  values,
  saved,
  editing,
  errors,
  onFieldChange,
}: {
  values: Vals;
  saved: Vals | null;
  editing: boolean;
  errors: Record<string, string>;
  onFieldChange: (name: string, value: unknown) => void;
}) {
  return (
    <section className="rounded-lg border bg-card shadow-sm">
      <div className="flex items-center gap-3 px-5 py-5">
        <CalendarDays className="h-5 w-5 text-cyan-600" />
        <h3 className="text-base font-bold text-slate-900">Temporal Context</h3>
      </div>
      <div className="space-y-5 px-8 pb-6 pt-1">
        {CONTEXT_FIELDS.map((field) => (
          <div key={field.name}>
            <div className="mb-2 text-xs font-bold text-slate-700">{field.label}</div>
            {editing ? (
              <>
                <MetricInput
                  name={field.name}
                  type={field.type}
                  value={values[field.name] ?? ""}
                  onFieldChange={onFieldChange}
                />
                {errors[field.name] ? (
                  <p className="mt-1 text-xs text-destructive">{errors[field.name]}</p>
                ) : null}
              </>
            ) : (
              <div className="text-lg font-bold text-slate-900">
                {displayContextValue(saved?.[field.name], field.type)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function formatDateForInput(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function displayContextValue(value: unknown, type: ContextField["type"]) {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "date") {
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("en-GB").replace(/\//g, "-");
  }
  if (type === "number") return formatNumber(value, 2);
  if (type === "int") return formatNumber(value, 2);
  return String(value);
}
