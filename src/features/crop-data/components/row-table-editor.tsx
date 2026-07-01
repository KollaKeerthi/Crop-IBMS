"use client";

import { useState, type ReactNode } from "react";
import type { ZodType } from "zod";
import { toast } from "sonner";
import { Download, Plus, Trash2, Pencil, Upload, X } from "lucide-react";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateDisplay } from "@/lib/format";
import type { Vals } from "./metric-form";

export type RowFieldType = "text" | "number" | "int" | "date";
export type RowColumn = { name: string; label: string; type: RowFieldType };
export type ComputedColumn = {
  label: string;
  compute: (row: Vals) => string;
  className?: (row: Vals) => string;
};

type Mutations = {
  create: { mutateAsync: (input: Record<string, unknown>) => Promise<unknown>; isPending: boolean };
  update: {
    mutateAsync: (args: { rowId: string; input: Record<string, unknown> }) => Promise<unknown>;
    isPending: boolean;
  };
  remove: { mutateAsync: (rowId: string) => Promise<unknown>; isPending: boolean };
};

type Props = {
  title: string;
  description?: string;
  newLabel?: string;
  showExport?: boolean;
  showBulkUpload?: boolean;
  columns: RowColumn[];
  computed?: ComputedColumn[];
  dateFields?: readonly string[];
  schema: ZodType;
  rows: Vals[];
  mutations: Mutations;
  defaultValues?: Vals;
  readOnly?: boolean;
  after?: ReactNode;
};

function emptyForm(columns: RowColumn[]): Vals {
  const v: Vals = {};
  for (const c of columns) v[c.name] = "";
  return v;
}

function fromRow(row: Vals, columns: RowColumn[]): Vals {
  const v: Vals = {};
  for (const c of columns) {
    const raw = row[c.name];
    if (c.type === "date") {
      const d = raw ? new Date(raw as string) : null;
      v[c.name] = d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
    } else {
      v[c.name] = raw ?? "";
    }
  }
  return v;
}

function displayCell(value: unknown, type: RowFieldType): string {
  if (value === null || value === undefined || value === "") return "-";
  if (type === "date") {
    return formatDateDisplay(value as string);
  }
  return String(value);
}

export function RowTableEditor({
  title,
  description,
  newLabel = "New",
  showExport = false,
  showBulkUpload = false,
  columns,
  computed = [],
  dateFields = [],
  schema,
  rows,
  mutations,
  defaultValues = {},
  readOnly = false,
  after,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Vals>(() => emptyForm(columns));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saving = mutations.create.isPending || mutations.update.isPending;

  function openNew() {
    setForm({ ...emptyForm(columns), ...defaultValues });
    setEditingId(null);
    setErrors({});
    setShowForm(true);
  }

  function openEdit(row: Vals) {
    setForm(fromRow(row, columns));
    setEditingId(String(row.id));
    setErrors({});
    setShowForm(true);
  }

  function close() {
    setShowForm(false);
    setEditingId(null);
    setErrors({});
  }

  function setField(name: string, value: unknown) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function assemble(): Vals {
    const dateSet = new Set(dateFields);
    const payload: Vals = {};
    for (const c of columns) {
      const v = form[c.name];
      if (c.type === "number" || c.type === "int") {
        payload[c.name] = v === "" || v === null || v === undefined ? null : Number(v);
      } else if (dateSet.has(c.name) || c.type === "date") {
        payload[c.name] = v === "" || v === null || v === undefined ? null : v;
      } else {
        payload[c.name] = v === "" ? null : v;
      }
    }
    return payload;
  }

  async function submit() {
    const payload = assemble();
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const fe: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const k = String(issue.path[0] ?? "");
        if (k && !fe[k]) fe[k] = issue.message;
      }
      setErrors(fe);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      if (editingId) {
        await mutations.update.mutateAsync({ rowId: editingId, input: parsed.data as Vals });
        toast.success("Record updated");
      } else {
        await mutations.create.mutateAsync(parsed.data as Vals);
        toast.success("Record added");
      }
      close();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save.");
    }
  }

  async function handleDelete(rowId: string) {
    try {
      await mutations.remove.mutateAsync(rowId);
      toast.success("Record deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete.");
    }
  }

  function renderInput(c: RowColumn) {
    const value = (form[c.name] ?? "") as string | number;
    const type = c.type === "int" ? "number" : c.type === "number" ? "number" : c.type;
    return (
      <Input
        className="h-8 text-sm"
        type={type === "text" ? "text" : type}
        step={c.type === "int" ? 1 : c.type === "number" ? "any" : undefined}
        value={value}
        onChange={(e) => setField(c.name, e.target.value)}
      />
    );
  }

  return (
    <div className="overflow-hidden border border-[var(--erp-border)] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--erp-border)] px-3 py-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-bold text-[var(--erp-ink)]">{title}</h3>
            {description ? (
              <span className="text-[0.62rem] font-semibold text-[var(--erp-muted)]">
                {description}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showExport ? (
            <Button size="sm" variant="outline" className="h-7 rounded-sm text-[0.65rem]">
              <Download className="mr-1.5 size-3.5" /> Export
            </Button>
          ) : null}
          {showBulkUpload ? (
            <Button size="sm" variant="outline" className="h-7 rounded-sm text-[0.65rem]">
              <Upload className="mr-1.5 size-3.5" /> Bulk Upload
            </Button>
          ) : null}
          {!showForm && !readOnly && (
            <Button size="sm" className="h-7 rounded-sm text-[0.65rem]" onClick={openNew}>
              <Plus className="mr-1.5 size-3.5" /> {newLabel}
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] px-4 py-3">
          <p className="mb-3 text-[0.62rem] font-bold uppercase tracking-widest text-[var(--erp-muted)]">
            {editingId ? "Edit Record" : "New Record"}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {columns.map((c) => (
              <div key={c.name}>
                <label className="mb-1 block text-[0.65rem] font-semibold text-[var(--erp-muted)]">
                  {c.label}
                </label>
                {renderInput(c)}
                {errors[c.name] && (
                  <p className="mt-1 text-xs text-destructive">{errors[c.name]}</p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-sm text-[0.65rem]"
              onClick={close}
              disabled={saving}
            >
              <X className="mr-1 size-3.5" /> Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 rounded-sm text-[0.65rem]"
              onClick={submit}
              disabled={saving}
            >
              {saving ? "Saving…" : editingId ? "Update Record" : "Add Record"}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] text-[0.68rem]">
          <thead>
            <tr className="border-b border-[var(--erp-border)] bg-[var(--erp-table-head)] text-[0.58rem] uppercase text-[var(--erp-muted)]">
              {columns.map((c) => (
                <th key={c.name} className="px-3 py-2 text-left font-bold">
                  {c.label}
                </th>
              ))}
              {computed.map((c) => (
                <th key={c.label} className="px-3 py-2 text-left font-bold">
                  {c.label}
                </th>
              ))}
              {!readOnly && <th className="px-3 py-2 text-right font-bold">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + computed.length + (readOnly ? 0 : 1)}
                  className="px-3 py-6 text-center text-[var(--erp-muted)]"
                >
                  No records yet. Click &quot;New&quot; to add one.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={String(row.id)}
                  className="border-b border-[var(--erp-border)] last:border-0"
                >
                  {columns.map((c) => (
                    <td key={c.name} className="px-3 py-2.5">
                      {displayCell(row[c.name], c.type)}
                    </td>
                  ))}
                  {computed.map((c) => (
                    <td
                      key={c.label}
                      className={`px-3 py-2.5 font-bold ${c.className?.(row) ?? ""}`}
                    >
                      {c.compute(row)}
                    </td>
                  ))}
                  {!readOnly && (
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDelete(String(row.id))}
                        disabled={mutations.remove.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {after ? (
        <div className="border-t border-[var(--erp-border)] bg-[var(--erp-canvas)] p-3">
          {after}
        </div>
      ) : null}
    </div>
  );
}
