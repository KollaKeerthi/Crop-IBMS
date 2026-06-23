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
    actualM2PerRow: null,
    noOfPlants: null,
    density: null,
    crop: fallbackCrop ?? "",
    cropVariety: "",
    type: index < 2 ? "Female" : "Male",
    plantingSpaceCm: null,
    planted: false,
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
  const mutation = useUpdateModule(cropDataId, farmId, MODULE_TYPE);

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.rowNo - a.rowNo), [rows]);
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

  function bulkFillSelection() {
    const firstPlanted = rows.find((row) => row.planted);
    const source = firstPlanted ?? rows[0];
    if (!source) return;
    setRows((current) =>
      current.map((row) => ({
        ...row,
        crop: row.crop || source.crop,
        cropVariety: row.cropVariety || source.cropVariety,
        m2PerRow: row.m2PerRow ?? source.m2PerRow,
        actualM2PerRow: row.actualM2PerRow ?? source.actualM2PerRow,
        noOfPlants: row.noOfPlants ?? source.noOfPlants,
        plantingSpaceCm: row.plantingSpaceCm ?? source.plantingSpaceCm,
      }))
    );
    toast.success("Blank planting values filled");
  }

  async function saveRows() {
    try {
      await mutation.mutateAsync({ rows });
      toast.success("Planting data saved");
    } catch {
      toast.error("Failed to save planting data");
    }
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
              <p className="text-sm text-muted-foreground">
                Track row-level planting density, spacing, and crop placement.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-md bg-muted p-1">
              <Button
                type="button"
                size="sm"
                variant={mode === "data" ? "secondary" : "ghost"}
                onClick={() => setMode("data")}
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
            <Button type="button" variant="outline" size="sm" onClick={bulkFillSelection}>
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
          <div className="border-t px-5 py-3 text-sm font-medium">
            Operational Scope: {rows.length} Records
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="flex flex-wrap items-center gap-3 border-b bg-primary px-5 py-3 text-primary-foreground">
            <span className="font-semibold">A / A2</span>
            <span className="text-sm opacity-85">2m x 25m - {fmtNum(totalArea)} m2</span>
            <span className="rounded-md bg-primary-foreground/10 px-3 py-1 text-sm">
              {rows.length} Rows
            </span>
            <span className="rounded-md bg-primary-foreground/10 px-3 py-1 text-sm">
              {totalPlants} Plants
            </span>
            <span className="rounded-md bg-primary-foreground/10 px-3 py-1 text-sm">
              Male {malePlants}
            </span>
            <span className="rounded-md bg-primary-foreground/10 px-3 py-1 text-sm">
              Female {femalePlants}
            </span>
            <span className="rounded-md bg-primary-foreground/10 px-3 py-1 text-sm">
              {plantedRows.length}/{rows.length} planted
            </span>
          </div>

          <div className="bg-muted p-4">
            <div className="rounded-lg border bg-background p-4 shadow-inner">
              <div className="mb-3 inline-flex rounded-md bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
                A - A2
              </div>
              <div className="space-y-2">
                {sortedRows.map((row) => {
                  const count = plantCount(row);
                  return (
                    <div
                      key={row.id}
                      className="group grid min-h-12 grid-cols-[3rem_minmax(30rem,1fr)] items-center gap-3 rounded-md border bg-card px-3 py-2"
                    >
                      <span
                        className={
                          row.planted
                            ? "rounded bg-primary px-2 py-1 text-center text-xs font-semibold text-primary-foreground"
                            : "rounded bg-muted px-2 py-1 text-center text-xs font-semibold text-muted-foreground"
                        }
                      >
                        R{row.rowNo}
                      </span>
                      {row.planted && count > 0 ? (
                        <div className="relative flex items-center gap-2 overflow-hidden">
                          {Array.from({ length: count }).map((_, index) => (
                            <Sprout
                              key={index}
                              className={
                                row.type === "Male"
                                  ? "h-4 w-4 shrink-0 text-primary"
                                  : "h-4 w-4 shrink-0 text-emerald-600"
                              }
                            />
                          ))}
                          <div className="absolute right-0 hidden rounded-md bg-foreground px-3 py-1 text-xs text-background shadow group-hover:block">
                            {row.noOfPlants ?? 0} plants&nbsp;&nbsp;
                            {row.plantingSpaceCm ?? "-"}cm&nbsp;&nbsp;
                            {row.type}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs italic text-muted-foreground">
                          <span className="h-1 w-6 rounded-full bg-muted" />
                          <span className="h-1 w-6 rounded-full bg-muted" />
                          <span className="h-1 w-6 rounded-full bg-muted" />
                          not planted
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 border-t bg-primary px-5 py-3 text-xs text-primary-foreground">
            <span className="font-semibold uppercase tracking-wide">Field Legend</span>
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-4 w-4 text-emerald-200" /> Female
            </span>
            <span className="inline-flex items-center gap-1">
              <Sprout className="h-4 w-4" /> Male
            </span>
            <span>Empty Soil</span>
            <span>Planted Row</span>
            <span>Empty Row</span>
          </div>
        </div>
      )}
    </div>
  );
}
