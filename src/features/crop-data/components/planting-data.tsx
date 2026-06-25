"use client";

import { useMemo, useState } from "react";
import { Eye, Grid3X3, Plus, Save, Sprout, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateModule } from "../hooks";
import { fmtNum, toNum } from "../compute";

type PlantingType = "Male" | "Female";

type PlantingRow = {
  id: string;
  rowNo: number;
  m2PerRow: number | null;
  actualM2PerRow: number | null;
  noOfPlants: number | null;
  density: number | null;
  crop: string;
  cropVariety: string;
  type: PlantingType;
  plantingSpaceCm: number | null;
  planted: boolean;
};

type Props = {
  cropDataId: string;
  farmId: string;
  initialData: Record<string, unknown> | null;
  fallbackCrop?: string | null;
  fallbackVariety?: string | null;
};

const MODULE_TYPE = "planting_records";
const DEFAULT_ROW_COUNT = 10;
const DEFAULT_M2_PER_ROW = 55;
const DEFAULT_ACTUAL_M2_PER_ROW = 10;

function newId() {
  return Math.random().toString(36).slice(2);
}

function parseRow(row: unknown, index: number, fallbackCrop?: string | null): PlantingRow {
  const value = row && typeof row === "object" ? (row as Record<string, unknown>) : {};
  const type = value.type === "Female" ? "Female" : "Male";
  return {
    id: typeof value.id === "string" ? value.id : newId(),
    rowNo: toNum(value.rowNo) ?? index + 1,
    m2PerRow: toNum(value.m2PerRow),
    actualM2PerRow: toNum(value.actualM2PerRow),
    noOfPlants: toNum(value.noOfPlants),
    density: toNum(value.density),
    crop: typeof value.crop === "string" ? value.crop : (fallbackCrop ?? ""),
    cropVariety: typeof value.cropVariety === "string" ? value.cropVariety : "",
    type,
    plantingSpaceCm: toNum(value.plantingSpaceCm),
    planted: Boolean(value.planted),
  };
}

function initialRows(
  data: Record<string, unknown> | null,
  fallbackCrop?: string | null
): PlantingRow[] {
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  if (rows.length > 0) return rows.map((row, index) => parseRow(row, index, fallbackCrop));

  return Array.from({ length: DEFAULT_ROW_COUNT }, (_, index) => ({
    id: newId(),
    rowNo: index + 1,
    m2PerRow: DEFAULT_M2_PER_ROW,
    actualM2PerRow: index === 1 ? 15 : index < 2 || (index >= 4 && index <= 6) ? 10 : null,
    noOfPlants: index === 1 ? 30 : index < 2 || (index >= 4 && index <= 6) ? 20 : null,
    density: index === 1 ? 2 : index < 2 || (index >= 4 && index <= 6) ? 2 : null,
    crop: fallbackCrop ?? "",
    cropVariety: "",
    type: index < 2 ? "Female" : "Male",
    plantingSpaceCm: index === 1 ? 25 : index < 2 ? 30 : index >= 4 && index <= 6 ? 10 : null,
    planted: index < 2 || (index >= 4 && index <= 6),
  }));
}

function numberValue(value: number | null) {
  return value ?? "";
}

function plantCount(row: PlantingRow) {
  return Math.max(0, Math.min(32, Math.round(row.noOfPlants ?? 0)));
}

function rowDensity(row: PlantingRow) {
  const plants = row.noOfPlants;
  const area = row.actualM2PerRow ?? row.m2PerRow;
  if (!plants || !area) return row.density;
  return plants / area;
}

function generatedPlantCode(rowNo: number, plantNo: number) {
  return `R${rowNo}-P${plantNo}`;
}

export function PlantingData({
  cropDataId,
  farmId,
  initialData,
  fallbackCrop,
  fallbackVariety,
}: Props) {
  const [mode, setMode] = useState<"data" | "visual">("data");
  const [rows, setRows] = useState<PlantingRow[]>(() => {
    const parsed = initialRows(initialData, fallbackCrop);
    return parsed.map((row) => ({
      ...row,
      crop: row.crop || fallbackCrop || "",
      cropVariety: row.cropVariety || fallbackVariety || "",
    }));
  });
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkSourceRowNo, setBulkSourceRowNo] = useState(1);
  const [bulkStartRowNo, setBulkStartRowNo] = useState(1);
  const [bulkEndRowNo, setBulkEndRowNo] = useState(DEFAULT_ROW_COUNT);
  const mutation = useUpdateModule(cropDataId, farmId, MODULE_TYPE);

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.rowNo - a.rowNo), [rows]);
  const selectedRow = rows.find((row) => row.id === selectedRowId) ?? null;
  const plantedRows = rows.filter((row) => row.planted);
  const totalPlants = rows.reduce((sum, row) => sum + (row.noOfPlants ?? 0), 0);
  const malePlants = rows
    .filter((row) => row.type === "Male")
    .reduce((sum, row) => sum + (row.noOfPlants ?? 0), 0);
  const femalePlants = rows
    .filter((row) => row.type === "Female")
    .reduce((sum, row) => sum + (row.noOfPlants ?? 0), 0);
  const totalArea = rows.reduce((sum, row) => sum + (row.m2PerRow ?? 0), 0);

  function updateRow(id: string, patch: Partial<PlantingRow>) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row;
        const next = { ...row, ...patch };
        return { ...next, density: rowDensity(next) };
      })
    );
  }

  function addRow() {
    const nextNo = rows.reduce((max, row) => Math.max(max, row.rowNo), 0) + 1;
    setRows((current) => [
      ...current,
      {
        id: newId(),
        rowNo: nextNo,
        m2PerRow: DEFAULT_M2_PER_ROW,
        actualM2PerRow: null,
        noOfPlants: null,
        density: null,
        crop: fallbackCrop ?? "",
        cropVariety: fallbackVariety ?? "",
        type: "Male",
        plantingSpaceCm: null,
        planted: false,
      },
    ]);
  }

  async function saveRows() {
    try {
      await mutation.mutateAsync({ rows });
      toast.success("Planting data saved");
    } catch {
      toast.error("Failed to save planting data");
    }
  }

  function duplicatePlantingSelection() {
    const from = Math.min(bulkStartRowNo, bulkEndRowNo);
    const to = Math.max(bulkStartRowNo, bulkEndRowNo);
    const source = rows.find((row) => row.rowNo === bulkSourceRowNo);
    if (!source) {
      toast.error("Select an existing source row");
      return;
    }

    let changed = 0;
    setRows((current) =>
      current.map((row) => {
        if (row.rowNo < from || row.rowNo > to || row.id === source.id) return row;
        changed += 1;
        const next = {
          ...row,
          m2PerRow: source.m2PerRow,
          actualM2PerRow: source.actualM2PerRow,
          noOfPlants: source.noOfPlants,
          crop: source.crop,
          cropVariety: source.cropVariety,
          type: source.type,
          plantingSpaceCm: source.plantingSpaceCm,
          planted: source.planted,
        };
        return { ...next, density: rowDensity(next) };
      })
    );
    toast.success(
      changed ? `Duplicated row ${bulkSourceRowNo} to ${changed} rows` : "No rows changed"
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Grid3X3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold">Planting data</h3>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-md bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={mode === "data" ? "secondary" : "ghost"}
                onClick={() => {
                  setMode("data");
                  setBulkOpen(false);
                }}
              >
                <Grid3X3 className="mr-1.5 h-4 w-4" />
                Data
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "visual" ? "secondary" : "ghost"}
                onClick={() => setMode("visual")}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Visual
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBulkOpen((open) => !open)}
            >
              <Wand2 className="mr-1.5 h-4 w-4" />
              Bulk Fill Selection
            </Button>
            <Button type="button" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-4 w-4" />
              New Entry
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={saveRows}>
              <Save className="mr-1.5 h-4 w-4" />
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      {bulkOpen ? (
        <div className="rounded-lg border bg-card px-5 py-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold">Bulk Fill Selection</h3>
            <p className="text-sm text-muted-foreground">
              Fill crop, variety, type, row length, plant count, spacing, and density inputs from
              one row into a selected row range.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,10rem)_minmax(0,22rem)_minmax(0,10rem)_auto]">
            <label className="space-y-1 text-sm">
              <span className="font-medium">Fill from</span>
              <Input
                type="number"
                min={1}
                placeholder="Row number"
                value={bulkSourceRowNo}
                onChange={(event) => setBulkSourceRowNo(Number(event.target.value) || 1)}
              />
            </label>
            <div className="space-y-1 text-sm">
              <span className="font-medium">Fill to</span>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={bulkStartRowNo}
                  onChange={(event) => setBulkStartRowNo(Number(event.target.value) || 1)}
                />
                <Input
                  type="number"
                  min={1}
                  placeholder="10"
                  value={bulkEndRowNo}
                  onChange={(event) => setBulkEndRowNo(Number(event.target.value) || 1)}
                />
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <span className="font-medium">Preview</span>
              <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-muted-foreground">
                R{bulkSourceRowNo} to R{Math.min(bulkStartRowNo, bulkEndRowNo)}-
                {Math.max(bulkStartRowNo, bulkEndRowNo)}
              </div>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={duplicatePlantingSelection}>
                <Wand2 className="mr-1.5 h-4 w-4" />
                Fill
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {mode === "data" ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-250 text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Row No</th>
                <th className="px-4 py-3 text-left font-medium">M2/Row</th>
                <th className="px-4 py-3 text-left font-medium">Actual M2/Row</th>
                <th className="px-4 py-3 text-left font-medium">No of Plants</th>
                <th className="px-4 py-3 text-left font-medium">Density</th>
                <th className="px-4 py-3 text-left font-medium">Crop</th>
                <th className="px-4 py-3 text-left font-medium">Crop Variety</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Planting Space (cm)</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-20"
                      type="number"
                      value={row.rowNo}
                      onChange={(event) =>
                        updateRow(row.id, { rowNo: Number(event.target.value) || row.rowNo })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      value={numberValue(row.m2PerRow)}
                      onChange={(event) =>
                        updateRow(row.id, {
                          m2PerRow: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      value={numberValue(row.actualM2PerRow)}
                      onChange={(event) =>
                        updateRow(row.id, {
                          actualM2PerRow: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-24"
                      type="number"
                      value={numberValue(row.noOfPlants)}
                      onChange={(event) =>
                        updateRow(row.id, {
                          noOfPlants: event.target.value ? Number(event.target.value) : null,
                          planted: Boolean(event.target.value),
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">{fmtNum(rowDensity(row))}</td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-32"
                      value={row.crop}
                      onChange={(event) => updateRow(row.id, { crop: event.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-32"
                      value={row.cropVariety}
                      onChange={(event) => updateRow(row.id, { cropVariety: event.target.value })}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={row.type}
                      onValueChange={(value) =>
                        updateRow(row.id, { type: value === "Female" ? "Female" : "Male" })
                      }
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      className="h-8 w-28"
                      type="number"
                      value={numberValue(row.plantingSpaceCm)}
                      onChange={(event) =>
                        updateRow(row.id, {
                          plantingSpaceCm: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant={row.planted ? "secondary" : "outline"}
                      onClick={() => updateRow(row.id, { planted: !row.planted })}
                    >
                      {row.planted ? "Planted" : "Not planted"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50/60">
          <div className="flex flex-wrap items-center gap-3 border-b border-emerald-800 bg-emerald-900 px-5 py-3 text-emerald-50">
            <span className="font-semibold text-white">A / A2</span>
            <span className="text-sm text-emerald-100">2m x 25m - {fmtNum(totalArea)} m2</span>
            <span className="rounded-full bg-emerald-700 px-3 py-1 text-sm font-semibold text-emerald-50 shadow-inner">
              {rows.length} Rows
            </span>
            <span className="rounded-full bg-emerald-700 px-3 py-1 text-sm font-semibold text-emerald-50 shadow-inner">
              {totalPlants} Plants
            </span>
            <span className="rounded-full bg-sky-800 px-3 py-1 text-sm font-semibold text-sky-50 shadow-inner">
              Male {malePlants}
            </span>
            <span className="rounded-full bg-rose-800 px-3 py-1 text-sm font-semibold text-rose-50 shadow-inner">
              Female {femalePlants}
            </span>
            <span className="rounded-full bg-lime-700 px-3 py-1 text-sm font-semibold text-lime-50 shadow-inner">
              {plantedRows.length}/{rows.length} planted
            </span>
          </div>

          <div className="bg-emerald-50 p-4">
            <div className="rounded-xl border border-emerald-500 bg-gradient-to-b from-emerald-100 via-lime-100 to-emerald-200 p-4 shadow-[inset_0_0_0_4px_rgba(16,185,129,0.18),inset_0_16px_30px_rgba(255,255,255,0.35),0_18px_35px_rgba(15,118,110,0.14)]">
              <div className="mb-3 inline-flex rounded-md bg-emerald-700 px-3 py-1 text-sm font-semibold text-white shadow">
                A - A2
              </div>
              <div className="space-y-2">
                {sortedRows.map((row) => {
                  const count = plantCount(row);
                  const plantedTone =
                    row.type === "Female"
                      ? "bg-gradient-to-b from-emerald-100 to-emerald-200"
                      : "bg-gradient-to-b from-sky-100 to-emerald-100";
                  return (
                    <div
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedRowId(row.id);
                        updateRow(row.id, { planted: !row.planted });
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedRowId(row.id);
                          updateRow(row.id, { planted: !row.planted });
                        }
                      }}
                      className={`group grid min-h-12 cursor-pointer grid-cols-[3rem_minmax(30rem,1fr)] items-center gap-3 rounded-md border bg-card px-3 py-2 transition ${
                        row.planted
                          ? `${plantedTone} border-emerald-400 shadow-[inset_0_2px_8px_rgba(255,255,255,0.55),0_1px_2px_rgba(15,118,110,0.18)]`
                          : "border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 opacity-70 shadow-[inset_0_2px_10px_rgba(148,163,184,0.16)]"
                      } ${
                        selectedRowId === row.id
                          ? "ring-2 ring-lime-500"
                          : "hover:border-emerald-500"
                      }`}
                    >
                      <span
                        className={
                          row.planted
                            ? row.type === "Female"
                              ? "rounded bg-[#0cae57] px-2 py-1 text-center text-xs font-semibold text-white shadow"
                              : "rounded bg-[#1b75f2] px-2 py-1 text-center text-xs font-semibold text-white shadow"
                            : "rounded bg-[#d2d5cf] px-2 py-1 text-center text-xs font-semibold text-[#6b7280] shadow"
                        }
                      >
                        R{row.rowNo}
                      </span>
                      {row.planted && count > 0 ? (
                        <div className="relative flex items-center gap-2 overflow-hidden">
                          {Array.from({ length: count }).map((_, index) => {
                            const plantNo = index + 1;
                            const code = generatedPlantCode(row.rowNo, plantNo);
                            return (
                              <span key={code} title={code} aria-label={code}>
                                <Sprout
                                  key={code}
                                  className={
                                    row.type === "Male"
                                      ? "h-4 w-4 shrink-0 text-[#4b8dff] drop-shadow-[0_0_2px_rgba(110,168,255,0.8)]"
                                      : "h-4 w-4 shrink-0 text-[#22c76a] drop-shadow-[0_0_2px_rgba(65,220,116,0.8)]"
                                  }
                                />
                              </span>
                            );
                          })}
                          <div className="absolute right-0 hidden rounded-md bg-slate-900 px-3 py-1 text-xs text-white shadow group-hover:block">
                            {row.noOfPlants ?? 0} plants&nbsp;&nbsp;
                            {row.plantingSpaceCm ?? "-"}cm&nbsp;&nbsp;
                            {row.type}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs italic text-slate-400">
                          <span className="h-1 w-6 rounded-full bg-slate-300" />
                          <span className="h-1 w-6 rounded-full bg-slate-300" />
                          <span className="h-1 w-6 rounded-full bg-slate-300" />
                          not planted
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedRow ? (
                <div className="mt-4 rounded-lg border bg-card p-4">
                  <div className="mb-3 text-sm font-semibold">
                    Selected Row R{selectedRow.rowNo}
                  </div>
                  <div className="grid gap-3 md:grid-cols-5">
                    <Input
                      type="number"
                      value={numberValue(selectedRow.noOfPlants)}
                      placeholder="Plants"
                      onChange={(event) =>
                        updateRow(selectedRow.id, {
                          noOfPlants: event.target.value ? Number(event.target.value) : null,
                          planted: Boolean(event.target.value),
                        })
                      }
                    />
                    <Input
                      type="number"
                      value={numberValue(selectedRow.plantingSpaceCm)}
                      placeholder="Space cm"
                      onChange={(event) =>
                        updateRow(selectedRow.id, {
                          plantingSpaceCm: event.target.value ? Number(event.target.value) : null,
                        })
                      }
                    />
                    <Select
                      value={selectedRow.type}
                      onValueChange={(value) =>
                        updateRow(selectedRow.id, { type: value === "Female" ? "Female" : "Male" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant={selectedRow.planted ? "secondary" : "outline"}
                      onClick={() => updateRow(selectedRow.id, { planted: !selectedRow.planted })}
                    >
                      {selectedRow.planted ? "Planted" : "Not planted"}
                    </Button>
                    <Button type="button" onClick={saveRows} disabled={mutation.isPending}>
                      Save Row
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t border-emerald-800 bg-emerald-900 px-5 py-3 text-xs text-emerald-50">
            <span className="font-semibold uppercase tracking-wide">Field Legend</span>
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-4 w-4 text-[#22c76a]" /> Female
            </span>
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-4 w-4 text-[#4b8dff]" /> Male
            </span>
            <span>Unassigned</span>
            <span>Planted Row</span>
            <span>Empty Row</span>
          </div>
        </div>
      )}
    </div>
  );
}
