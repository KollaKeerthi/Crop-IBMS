"use client";

import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import { useMemo, useState } from "react";
import { CalendarDays, Info, Pencil, X } from "lucide-react";
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
    label: "Planned No. of Plants",
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
    label: "Planned Plants / m2",
    type: "number",
    male: "malePlannedPlantsPerSqm",
    female: "femalePlannedPlantsPerSqm",
  },
  { kind: "single", label: "Planned Surface Area", type: "number", name: "plannedSurfaceArea" },
  { kind: "single", label: "Planned No. of Rows", type: "int", name: "plannedNoOfRows" },
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
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,1fr)]">
      <MetricForm
        title="Program Parameters"
        description="Manage sowing dates, plant counts, and yield targets."
        icon={<Info className="h-4 w-4" />}
        editLabel="Edit Parameters"
        rows={PLANNING_ROWS}
        initial={programInfo}
        schema={UpdateProgramInfoInputSchema}
        columnLabels={{ left: "Male Parent", right: "Female Parent" }}
        dateFields={PROGRAM_INFO_DATE_FIELDS}
        isSaving={mutation.isPending}
        onSave={(values) => mutation.mutateAsync(values as UpdateProgramInfoInput)}
        onValuesChange={computeProgramInfoDerivedFields}
      />
      <TemporalContextCard
        programInfo={programInfo}
        isSaving={mutation.isPending}
        onSave={(values) => mutation.mutateAsync(values)}
      />
    </div>
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
  return String(value);
}

function buildContextState(programInfo: Vals | null): Record<string, string | number> {
  const state: Record<string, string | number> = {};
  for (const field of CONTEXT_FIELDS) {
    const value = programInfo?.[field.name];
    state[field.name] =
      field.type === "date" ? formatDateForInput(value) : ((value ?? "") as string);
  }
  return state;
}

function TemporalContextCard({
  programInfo,
  isSaving,
  onSave,
}: {
  programInfo: Vals | null;
  isSaving: boolean;
  onSave: (values: UpdateProgramInfoInput) => Promise<unknown>;
}) {
  const dateSet = useMemo(() => new Set<string>(PROGRAM_INFO_DATE_FIELDS), []);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string | number>>(() =>
    buildContextState(programInfo)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  function startEdit() {
    setValues(buildContextState(programInfo));
    setErrors({});
    setEditing(true);
  }

  function cancelEdit() {
    setValues(buildContextState(programInfo));
    setErrors({});
    setEditing(false);
  }

  function setField(name: string, value: string | number) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  function renderInput(field: ContextField) {
    const value = values[field.name] ?? "";
    if (field.type === "textarea") {
      return (
        <Textarea
          value={value as string}
          rows={3}
          onChange={(event) => setField(field.name, event.target.value)}
        />
      );
    }
    return (
      <Input
        type={field.type === "date" ? "date" : field.type === "text" ? "text" : "number"}
        step={field.type === "int" ? 1 : field.type === "number" ? "any" : undefined}
        value={value}
        onChange={(event) => setField(field.name, event.target.value)}
      />
    );
  }

  async function handleSave() {
    const payload: Record<string, unknown> = {};
    for (const field of CONTEXT_FIELDS) {
      const value = values[field.name];
      if (field.type === "number" || field.type === "int") {
        payload[field.name] =
          value === "" || value === null || value === undefined ? null : Number(value);
      } else if (dateSet.has(field.name)) {
        payload[field.name] = value === "" ? null : value;
      } else {
        payload[field.name] = value === "" ? null : value;
      }
    }
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
    await onSave(parsed.data);
    toast.success("Temporal Context saved");
    setEditing(false);
  }

  return (
    <section className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <CalendarDays className="h-4 w-4" />
          </div>
          <h3 className="text-lg font-semibold">Temporal Context</h3>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit Context
          </Button>
        )}
      </div>

      <div className="space-y-5 border-t px-5 py-5">
        {CONTEXT_FIELDS.map((field) => (
          <div key={field.name}>
            <div className="mb-2 text-xs font-semibold text-muted-foreground">{field.label}</div>
            {editing ? (
              <>
                {renderInput(field)}
                {errors[field.name] ? (
                  <p className="mt-1 text-xs text-destructive">{errors[field.name]}</p>
                ) : null}
              </>
            ) : (
              <div className="text-base font-semibold text-foreground">
                {displayContextValue(programInfo?.[field.name], field.type)}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
