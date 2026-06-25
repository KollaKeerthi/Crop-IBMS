"use client";

import { useMemo, useState, type ReactNode } from "react";
import { DollarSign, Info, Pencil, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UpdateRevenueInputSchema, type UpdateRevenueInput } from "../schema";
import { useUpdateRevenue } from "../hooks";
import { fmtNum, revenueSide } from "../compute";

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

  return (
    <div className="space-y-5">
      <section className="rounded-lg border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold tracking-tight">Revenue Projections</h3>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Track and manage financial metrics and projections.
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
              Edit Financials
            </Button>
          )}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(20rem,1fr)]">
        <RevenueTable
          values={displayValues}
          editing={editing}
          errors={errors}
          programInfo={programInfo}
          onFieldChange={setField}
        />
        <div className="space-y-5">
          <RemarksCard
            title="Planned Remarks"
            name="plannedRemarks"
            value={displayValues.plannedRemarks}
            editing={editing}
            error={errors.plannedRemarks}
            onFieldChange={setField}
          />
          <RemarksCard
            title="Actual Remarks"
            name="actualRemarks"
            value={displayValues.actualRemarks}
            editing={editing}
            error={errors.actualRemarks}
            onFieldChange={setField}
          />
        </div>
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

function displayValue(value: unknown, digits = 2) {
  if (value === null || value === undefined || value === "") return "-";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function RevenueTable({
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
  const planned = revenueSide(values, programInfo, "male");
  const actual = revenueSide(values, programInfo, "female");

  function inputCell(name: keyof UpdateRevenueInput, type: "number" | "int") {
    if (!editing) return <strong>{displayValue(values[name])}</strong>;
    return (
      <div>
        <Input
          className="h-9"
          type="number"
          step={type === "int" ? 1 : "any"}
          value={(values[name] ?? "") as string | number}
          onChange={(event) => onFieldChange(name, event.target.value)}
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
            <th className="w-[34%] px-5 py-4 text-left font-bold text-slate-900">
              Metric Definition
            </th>
            <th className="w-[33%] px-5 py-4 text-left font-bold text-cyan-700">
              Planned Projection
            </th>
            <th className="w-[33%] px-5 py-4 text-left font-bold text-emerald-700">
              Actual Performance
            </th>
          </tr>
        </thead>
        <tbody>
          <RevenueRow
            label="Total number of Weeks"
            planned={inputCell("maleTotalWeeks", "int")}
            actual={inputCell("femaleTotalWeeks", "int")}
          />
          <RevenueRow
            label="Agreed Unit Price"
            planned={inputCell("maleAgreedUnitPrice", "number")}
            actual={inputCell("femaleAgreedUnitPrice", "number")}
          />
          <RevenueRow
            label="Contract Revenue"
            planned={<strong>{fmtNum(planned.contractRevenue, 2)}</strong>}
            actual={
              <strong className="text-emerald-700">{fmtNum(actual.contractRevenue, 2)}</strong>
            }
          />
          <RevenueRow
            label="Additional Revenue"
            planned={<span />}
            actual={
              editing ? (
                inputCell("additionalRevenue", "number")
              ) : (
                <strong className="text-emerald-700">
                  {displayValue(values.additionalRevenue)}
                </strong>
              )
            }
          />
          <RevenueRow
            label="Total Revenue"
            planned={<strong>{fmtNum(planned.totalRevenue, 2)}</strong>}
            actual={<strong className="text-emerald-700">{fmtNum(actual.totalRevenue, 2)}</strong>}
          />
          <RevenueRow
            label="Total Revenue m²"
            planned={<strong>{fmtNum(planned.totalRevenuePerSqm, 2)}</strong>}
            actual={
              <strong className="text-emerald-700">{fmtNum(actual.totalRevenuePerSqm, 2)}</strong>
            }
          />
          <RevenueRow
            label="Total Revenue m²/wk"
            planned={<strong>{fmtNum(planned.totalRevenuePerSqmWk, 2)}</strong>}
            actual={
              <strong className="text-emerald-700">{fmtNum(actual.totalRevenuePerSqmWk, 2)}</strong>
            }
          />
        </tbody>
      </table>
    </section>
  );
}

function RevenueRow({
  label,
  planned,
  actual,
}: {
  label: string;
  planned: ReactNode;
  actual: ReactNode;
}) {
  return (
    <tr className="border-b last:border-0">
      <td className="px-5 py-4 font-semibold text-muted-foreground">{label}</td>
      <td className="px-5 py-4 text-slate-900">{planned}</td>
      <td className="px-5 py-4 text-slate-900">{actual}</td>
    </tr>
  );
}

function RemarksCard({
  title,
  name,
  value,
  editing,
  error,
  onFieldChange,
}: {
  title: string;
  name: "plannedRemarks" | "actualRemarks";
  value: unknown;
  editing: boolean;
  error?: string;
  onFieldChange: (name: string, value: string) => void;
}) {
  return (
    <section className="rounded-lg border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
        <Info className="h-4 w-4 text-cyan-600" />
        {title}
      </div>
      {editing ? (
        <>
          <Textarea
            value={(value ?? "") as string}
            rows={4}
            onChange={(event) => onFieldChange(name, event.target.value)}
          />
          {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
        </>
      ) : (
        <div className="min-h-24 rounded-md border bg-muted/20 px-4 py-4 text-sm italic text-muted-foreground">
          {value ? String(value) : `All the ${title.toLowerCase()} are here`}
        </div>
      )}
    </section>
  );
}
