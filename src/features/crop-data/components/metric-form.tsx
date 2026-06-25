"use client";

import { type ReactNode, useMemo, useState } from "react";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { Pencil, X } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDateDisplay } from "@/lib/format";

export type FieldType = "text" | "number" | "int" | "date" | "textarea";
export type Placement = "male" | "female" | "span";

export type MetricRow =
  | { kind: "mf"; label: string; type: FieldType; male: string; female: string; suffix?: string }
  | {
      kind: "single";
      label: string;
      type: FieldType;
      name: string;
      suffix?: string;
      placement?: Placement;
    }
  | {
      kind: "computed";
      label: string;
      placement?: Placement;
      compute: (values: Vals, ctx: Vals) => string;
    }
  | {
      kind: "computed-mf";
      label: string;
      computeMale: (values: Vals, ctx: Vals) => string;
      computeFemale: (values: Vals, ctx: Vals) => string;
    }
  | { kind: "subheader"; label: string };

export type Vals = Record<string, unknown>;

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  editLabel?: string;
  rows: MetricRow[];
  /** Existing DB record (or null when nothing saved yet). */
  initial: Vals | null;
  /** Zod schema used to validate the assembled payload before saving. */
  schema: ZodType;
  /** Field names that are dates (formatted to yyyy-mm-dd for inputs). */
  dateFields?: readonly string[];
  /** Extra read-only context passed to computed cells (e.g. cross-section values). */
  computeContext?: Vals;
  /** Whether to render the two-column layout (single-column sections set false). */
  showGenderColumns?: boolean;
  /** Override the two column headers (defaults to ♂ Male / ♀ Female). */
  columnLabels?: { left: string; right: string };
  isSaving?: boolean;
  onSave: (values: Vals) => Promise<unknown>;
  onValuesChange?: (values: Vals) => Vals;
};

function formatDateForInput(v: unknown): string {
  if (!v) return "";
  const d = new Date(v as string);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function displayValue(v: unknown, type: FieldType): string {
  if (v === null || v === undefined || v === "") return "-";
  if (type === "date") {
    return formatDateDisplay(v as string);
  }
  return String(v);
}

/** Collect every editable field name + its type from the row config. */
function editableFields(rows: MetricRow[]): { name: string; type: FieldType }[] {
  const out: { name: string; type: FieldType }[] = [];
  for (const row of rows) {
    if (row.kind === "mf") {
      out.push({ name: row.male, type: row.type }, { name: row.female, type: row.type });
    } else if (row.kind === "single") {
      out.push({ name: row.name, type: row.type });
    }
  }
  return out;
}

export function MetricForm({
  title,
  description,
  icon,
  editLabel = "Edit Details",
  rows,
  initial,
  schema,
  dateFields = [],
  computeContext = {},
  showGenderColumns = true,
  columnLabels,
  isSaving = false,
  onSave,
  onValuesChange,
}: Props) {
  const fields = useMemo(() => editableFields(rows), [rows]);

  const buildState = useMemo(
    () => (): Vals => {
      const state: Vals = {};
      for (const { name, type } of fields) {
        const raw = initial?.[name];
        if (type === "date") state[name] = formatDateForInput(raw);
        else state[name] = raw ?? "";
      }
      return onValuesChange ? onValuesChange(state) : state;
    },
    [fields, initial, onValuesChange]
  );

  const [values, setValues] = useState<Vals>(buildState);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setField(name: string, value: unknown) {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      return onValuesChange ? onValuesChange(next) : next;
    });
  }

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

  function assemblePayload(): Vals {
    const dateSet = new Set(dateFields);
    const payload: Vals = {};
    const fieldNames = new Set(fields.map((field) => field.name));
    for (const { name, type } of fields) {
      const v = values[name];
      if (type === "number" || type === "int") {
        payload[name] = v === "" || v === null || v === undefined ? null : Number(v);
      } else if (dateSet.has(name) || type === "date") {
        payload[name] = v === "" || v === null || v === undefined ? null : v;
      } else {
        payload[name] = v === "" ? null : v;
      }
    }
    for (const [name, value] of Object.entries(values)) {
      if (!fieldNames.has(name) && value !== undefined) {
        payload[name] = value === "" ? null : value;
      }
    }
    return payload;
  }

  async function handleSave() {
    const payload = assemblePayload();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      await onSave(parsed.data as Vals);
      toast.success(`${title} saved`);
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save.");
    }
  }

  function renderInput(name: string, type: FieldType) {
    const common = "h-8 text-sm";
    const value = (values[name] ?? "") as string | number;
    if (type === "textarea") {
      return (
        <Textarea
          value={value as string}
          rows={2}
          onChange={(e) => setField(name, e.target.value)}
        />
      );
    }
    if (type === "number" || type === "int") {
      return (
        <Input
          className={common}
          type="number"
          step={type === "int" ? 1 : "any"}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
        />
      );
    }
    if (type === "date") {
      return (
        <Input
          className={common}
          type="date"
          value={value as string}
          onChange={(e) => setField(name, e.target.value)}
        />
      );
    }
    return (
      <Input
        className={common}
        value={value as string}
        onChange={(e) => setField(name, e.target.value)}
      />
    );
  }

  function cell(name: string, type: FieldType, suffix?: string) {
    if (editing) {
      return (
        <div>
          {renderInput(name, type)}
          {errors[name] && <p className="mt-1 text-xs text-destructive">{errors[name]}</p>}
        </div>
      );
    }
    const text = displayValue(initial?.[name], type);
    return (
      <span className="text-sm font-medium text-foreground">
        {text}
        {suffix && text !== "-" ? ` ${suffix}` : ""}
      </span>
    );
  }

  // Computed cells read live form state while editing, otherwise the fresh
  // saved record (so totals update after a save without re-entering edit mode).
  const computeValues = editing ? values : buildState();
  const colCount = showGenderColumns ? 3 : 2;

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          {icon ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
          </div>
        </div>
        {editing ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEdit} disabled={isSaving}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> {editLabel}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {showGenderColumns && (
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="px-5 py-2.5 text-left font-medium">Metric Definition</th>
                <th
                  className={`px-3 py-2.5 text-left font-medium ${columnLabels ? "" : "text-blue-600"}`}
                >
                  {columnLabels ? columnLabels.left : "♂ Male"}
                </th>
                <th
                  className={`px-3 py-2.5 text-left font-medium ${columnLabels ? "" : "text-pink-600"}`}
                >
                  {columnLabels ? columnLabels.right : "♀ Female"}
                </th>
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, i) => {
              if (row.kind === "subheader") {
                return (
                  <tr key={i} className="bg-muted/30">
                    <td
                      colSpan={colCount}
                      className="px-5 py-2 text-xs font-semibold text-muted-foreground"
                    >
                      {row.label}
                    </td>
                  </tr>
                );
              }
              if (row.kind === "mf") {
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-5 py-2 text-muted-foreground">{row.label}</td>
                    <td className="px-3 py-2">{cell(row.male, row.type, row.suffix)}</td>
                    <td className="px-3 py-2">{cell(row.female, row.type, row.suffix)}</td>
                  </tr>
                );
              }
              if (row.kind === "single") {
                const placement = row.placement ?? "female";
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-5 py-2 text-muted-foreground">{row.label}</td>
                    {!showGenderColumns ? (
                      <td className="px-3 py-2">{cell(row.name, row.type, row.suffix)}</td>
                    ) : placement === "span" ? (
                      <td className="px-3 py-2" colSpan={2}>
                        {cell(row.name, row.type, row.suffix)}
                      </td>
                    ) : placement === "male" ? (
                      <>
                        <td className="px-3 py-2">{cell(row.name, row.type, row.suffix)}</td>
                        <td className="px-3 py-2" />
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2">{cell(row.name, row.type, row.suffix)}</td>
                      </>
                    )}
                  </tr>
                );
              }
              if (row.kind === "computed-mf") {
                return (
                  <tr key={i} className="border-b bg-muted/10 last:border-0">
                    <td className="px-5 py-2 text-muted-foreground">{row.label}</td>
                    <td className="px-3 py-2">
                      <span className="text-sm font-semibold text-foreground">
                        {row.computeMale(computeValues, computeContext)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="text-sm font-semibold text-foreground">
                        {row.computeFemale(computeValues, computeContext)}
                      </span>
                    </td>
                  </tr>
                );
              }
              // computed
              const text = row.compute(computeValues, computeContext);
              const placement = row.placement ?? "female";
              const computedCell = (
                <span className="text-sm font-semibold text-foreground">{text}</span>
              );
              return (
                <tr key={i} className="border-b bg-muted/10 last:border-0">
                  <td className="px-5 py-2 text-muted-foreground">{row.label}</td>
                  {!showGenderColumns ? (
                    <td className="px-3 py-2">{computedCell}</td>
                  ) : placement === "span" ? (
                    <td className="px-3 py-2" colSpan={2}>
                      {computedCell}
                    </td>
                  ) : placement === "male" ? (
                    <>
                      <td className="px-3 py-2">{computedCell}</td>
                      <td className="px-3 py-2" />
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2" />
                      <td className="px-3 py-2">{computedCell}</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
