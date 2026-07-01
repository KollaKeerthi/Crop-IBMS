"use client";

import { useMemo, useState } from "react";
import { GitBranch, Printer, Save, Share2, Sprout, X } from "lucide-react";
import { toast } from "sonner";
import {
  UpdateProgramInfoInputSchema,
  PROGRAM_INFO_DATE_FIELDS,
  type UpdateProgramInfoInput,
} from "../schema";
import { useUpdateProgramInfo } from "../hooks";
import { computeProgramInfoDerivedFields, toNum } from "../compute";
import { formatDateDisplay } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type FieldType = "text" | "number" | "int" | "date" | "textarea";
type Vals = Record<string, unknown>;

const PLANNING_FIELDS = [
  { name: "maleBatchNo", type: "text" },
  { name: "femaleBatchNo", type: "text" },
  { name: "malePlannedSowingDate", type: "date" },
  { name: "femalePlannedSowingDate", type: "date" },
  { name: "malePlannedPlantingDate", type: "date" },
  { name: "femalePlannedPlantingDate", type: "date" },
  { name: "malePlannedPlants", type: "int" },
  { name: "femalePlannedPlants", type: "int" },
  { name: "malePlannedPlantsPerRow", type: "number" },
  { name: "femalePlannedPlantsPerRow", type: "number" },
  { name: "malePlannedPlantsPerSqm", type: "number" },
  { name: "femalePlannedPlantsPerSqm", type: "number" },
  { name: "plannedSurfaceArea", type: "number" },
  { name: "plannedNoOfRows", type: "int" },
  { name: "proposedGramPerPlant", type: "number" },
  { name: "agreedGramPerPlant", type: "number" },
  { name: "baseYieldKg", type: "number" },
  { name: "gramsPerSqm", type: "number" },
  { name: "maleRequestedQuantity", type: "number" },
  { name: "femaleRequestedQuantity", type: "number" },
] as const satisfies ReadonlyArray<{ name: string; type: FieldType }>;

const CONTEXT_FIELDS = [
  { label: "Material Arrival (Actual)", name: "materialArrivalDate", type: "date" },
  { label: "Block Prep Start (Actual)", name: "blockPrepStartDate", type: "date" },
  { label: "Block Prep End (Actual)", name: "blockPrepEndDate", type: "date" },
  { label: "Archive Status", name: "archiveStatus", type: "text" },
  { label: "Year", name: "productionYear", type: "int" },
  { label: "Agreed Order From (kg)", name: "agreedOrderFromCustomerKg", type: "number" },
  { label: "Req Delivery Date", name: "requestedDeliveryDate", type: "date" },
  { label: "Remarks From Customer", name: "remarksFromCustomer", type: "textarea" },
  { label: "Notes", name: "notes", type: "textarea" },
] as const satisfies ReadonlyArray<{ label: string; name: string; type: FieldType }>;

const ARCHIVE_STATUS_OPTIONS = ["RUN", "HOLD", "ARCHIVED"] as const;

const YEAR_OPTIONS = Array.from({ length: 7 }, (_, index) => String(2024 + index));

type Props = {
  cropDataId: string;
  farmId: string;
  programInfo: Vals | null;
};

type ParentRow =
  | {
      label: string;
      kind: "editable-mf";
      male: string;
      female: string;
      type: FieldType;
    }
  | {
      label: string;
      kind: "computed-mf";
      getMale: (values: Vals) => unknown;
      getFemale: (values: Vals) => unknown;
      type: "number" | "int";
    };

const PARENT_ROWS: ParentRow[] = [
  {
    label: "Planned Sowing Date",
    kind: "editable-mf",
    male: "malePlannedSowingDate",
    female: "femalePlannedSowingDate",
    type: "date",
  },
  {
    label: "Planned Planting Date",
    kind: "editable-mf",
    male: "malePlannedPlantingDate",
    female: "femalePlannedPlantingDate",
    type: "date",
  },
  {
    label: "Planned No of Plants",
    kind: "editable-mf",
    male: "malePlannedPlants",
    female: "femalePlannedPlants",
    type: "int",
  },
  {
    label: "Planned Surface Area",
    kind: "computed-mf",
    getMale: (values) => deriveDivision(values.malePlannedPlants, values.malePlannedPlantsPerSqm),
    getFemale: (values) =>
      deriveDivision(values.femalePlannedPlants, values.femalePlannedPlantsPerSqm),
    type: "number",
  },
  {
    label: "Planned Plants / m²",
    kind: "editable-mf",
    male: "malePlannedPlantsPerSqm",
    female: "femalePlannedPlantsPerSqm",
    type: "number",
  },
  {
    label: "Planned Plants / Row",
    kind: "editable-mf",
    male: "malePlannedPlantsPerRow",
    female: "femalePlannedPlantsPerRow",
    type: "number",
  },
  {
    label: "Planned No of Rows",
    kind: "computed-mf",
    getMale: (values) =>
      roundNullable(deriveDivision(values.malePlannedPlants, values.malePlannedPlantsPerRow)),
    getFemale: (values) =>
      roundNullable(deriveDivision(values.femalePlannedPlants, values.femalePlannedPlantsPerRow)),
    type: "int",
  },
  {
    label: "Requested Quantity",
    kind: "editable-mf",
    male: "maleRequestedQuantity",
    female: "femaleRequestedQuantity",
    type: "number",
  },
];

export function ProgramInfoForm({ cropDataId, farmId, programInfo }: Props) {
  const mutation = useUpdateProgramInfo(cropDataId, farmId);
  const fields = useMemo(() => [...PLANNING_FIELDS, ...CONTEXT_FIELDS], []);
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
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,2.15fr)_minmax(16rem,1fr)]">
        <section className="overflow-hidden rounded-md border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--erp-border)] bg-[var(--erp-info-muted)] px-4 py-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-white text-primary">
              <GitBranch className="size-4" />
            </span>
            <h3 className="text-base font-bold text-[var(--erp-ink)]">
              Parent Information &amp; Propagation
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)]">
                  <th className="w-[30%] px-3 py-2 text-left text-[0.68rem] font-bold text-[var(--erp-muted)]">
                    Metric
                  </th>
                  <th className="w-[35%] px-3 py-2 text-center text-[0.68rem] font-bold text-[var(--brand-secondary)]">
                    Male Parent
                  </th>
                  <th className="w-[35%] px-3 py-2 text-center text-[0.68rem] font-bold text-[var(--erp-warning)]">
                    Female Parent
                  </th>
                </tr>
              </thead>
              <tbody>
                {PARENT_ROWS.map((row) => (
                  <tr key={row.label} className="border-b border-[var(--erp-border)] last:border-0">
                    <td className="px-3 py-3 align-middle text-[0.82rem] leading-5 text-[var(--erp-ink)]">
                      {row.label}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {row.kind === "editable-mf"
                        ? renderMetricCell({
                            name: row.male,
                            type: row.type,
                            editing,
                            value: displayValues[row.male],
                            error: errors[row.male],
                            onFieldChange: setField,
                          })
                        : renderComputedCell(row.getMale(displayValues), row.type)}
                    </td>
                    <td className="px-3 py-2 align-middle">
                      {row.kind === "editable-mf"
                        ? renderMetricCell({
                            name: row.female,
                            type: row.type,
                            editing,
                            value: displayValues[row.female],
                            error: errors[row.female],
                            onFieldChange: setField,
                          })
                        : renderComputedCell(row.getFemale(displayValues), row.type)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="overflow-hidden rounded-md border border-[var(--erp-border)] bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3">
            <span className="flex size-7 items-center justify-center rounded-md bg-[var(--erp-warning-muted)] text-[var(--erp-warning)]">
              <Sprout className="size-4" />
            </span>
            <h3 className="text-base font-bold text-[var(--erp-ink)]">Program Lifecycle</h3>
          </div>

          <div className="space-y-4 px-4 py-4">
            {CONTEXT_FIELDS.map((field) => (
              <LifecycleField
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                editing={editing}
                value={displayValues[field.name]}
                error={errors[field.name]}
                onFieldChange={setField}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-md border border-[var(--erp-border)] bg-white px-4 py-3 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="sm" type="button" className="text-[var(--erp-muted)]">
              <Printer className="size-4" />
              Print Program
            </Button>
            <Button variant="ghost" size="sm" type="button" className="text-[var(--erp-muted)]">
              <Share2 className="size-4" />
              Share Data
            </Button>
          </div>

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
                <Button size="sm" type="button" onClick={handleSave} disabled={mutation.isPending}>
                  <Save className="size-4" />
                  {mutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" type="button">
                  Export to CSV
                </Button>
                <Button size="sm" type="button" onClick={startEdit}>
                  Edit Details
                </Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function buildProgramState(
  programInfo: Vals | null,
  fields: ReadonlyArray<{ name: string; type: FieldType }>
): Vals {
  const state: Vals = {};
  for (const field of fields) {
    const raw = programInfo?.[field.name];
    state[field.name] = field.type === "date" ? formatDateForInput(raw) : (raw ?? "");
  }
  return computeProgramInfoDerivedFields(state);
}

function assembleProgramPayload(
  values: Vals,
  fields: ReadonlyArray<{ name: string; type: FieldType }>
): UpdateProgramInfoInput {
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

function formatDateForInput(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function displayProgramValue(value: unknown, type: FieldType): string {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "date") return formatDateDisplay(value as string);
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

function deriveDivision(dividend: unknown, divisor: unknown): number | null {
  const left = toNum(dividend);
  const right = toNum(divisor);
  if (left === null || right === null || right === 0) return null;
  return left / right;
}

function roundNullable(value: number | null): number | null {
  return value === null ? null : Math.round(value);
}

function renderComputedCell(value: unknown, type: "number" | "int") {
  return (
    <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2 text-center text-[0.82rem] font-semibold text-[var(--erp-ink)]">
      {displayProgramValue(value, type)}
    </div>
  );
}

function renderMetricCell({
  name,
  type,
  editing,
  value,
  error,
  onFieldChange,
}: {
  name: string;
  type: FieldType;
  editing: boolean;
  value: unknown;
  error?: string;
  onFieldChange: (name: string, value: unknown) => void;
}) {
  if (!editing) {
    return (
      <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2 text-center text-[0.82rem] font-semibold text-[var(--erp-ink)]">
        {displayProgramValue(value, type)}
      </div>
    );
  }

  return (
    <div>
      <MetricInput name={name} type={type} value={value} onFieldChange={onFieldChange} compact />
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function MetricInput({
  name,
  type,
  value,
  onFieldChange,
  compact = false,
}: {
  name: string;
  type: FieldType;
  value: unknown;
  onFieldChange: (name: string, value: unknown) => void;
  compact?: boolean;
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

  if (name === "archiveStatus") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(event) => onFieldChange(name, event.target.value)}
        className="h-9 w-full rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 text-[0.78rem] font-semibold text-[var(--erp-ink)] outline-none"
      >
        <option value="">Select status</option>
        {ARCHIVE_STATUS_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (name === "productionYear") {
    return (
      <select
        value={String(value ?? "")}
        onChange={(event) => onFieldChange(name, event.target.value)}
        className="h-9 w-full rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 text-[0.78rem] font-semibold text-[var(--erp-ink)] outline-none"
      >
        <option value="">Select year</option>
        {YEAR_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Input
      className={
        compact
          ? "h-9 rounded-sm bg-[var(--erp-table-head)] text-center text-[0.78rem] font-semibold"
          : "h-9 rounded-sm bg-[var(--erp-table-head)] text-[0.78rem] font-semibold"
      }
      type={type === "date" ? "date" : type === "text" ? "text" : "number"}
      step={type === "int" ? 1 : type === "number" ? "any" : undefined}
      value={(value ?? "") as string | number}
      onChange={(event) => onFieldChange(name, event.target.value)}
    />
  );
}

function LifecycleField({
  label,
  name,
  type,
  editing,
  value,
  error,
  onFieldChange,
}: {
  label: string;
  name: string;
  type: FieldType;
  editing: boolean;
  value: unknown;
  error?: string;
  onFieldChange: (name: string, value: unknown) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-start gap-3">
      <div className="pt-1 text-[0.64rem] font-bold leading-4 text-[var(--erp-muted)]">{label}</div>
      <div>
        {editing ? (
          <MetricInput name={name} type={type} value={value} onFieldChange={onFieldChange} />
        ) : type === "textarea" ? (
          <div className="min-h-16 rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--erp-ink)]">
            {displayProgramValue(value, type)}
          </div>
        ) : (
          <div className="rounded-sm border border-[var(--erp-border)] bg-[var(--erp-table-head)] px-3 py-2 text-[0.78rem] font-semibold text-[var(--erp-ink)]">
            {displayProgramValue(value, type)}
          </div>
        )}
        {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
      </div>
    </div>
  );
}
