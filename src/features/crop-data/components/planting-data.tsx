"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Eye, Grid3X3, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

type Gender = "Male" | "Female";
type EntryStatus = "Planned" | "Planted";
type PlantingDirection = "top-bottom" | "bottom-top" | "left-right" | "right-left";
type PlantingSubtab = "summary" | "detail" | "visual";

type PlantingEntry = {
  id: string;
  rowNo: number;
  crop: string;
  cropVariety: string;
  gender: Gender;
  status: EntryStatus;
  plannedMeters: number | null;
  plannedPlants: number | null;
  plannedPlantSpace: number | null;
  plannedDensity: number | null;
  plantedMeters: number | null;
  plantedPlants: number | null;
  plantedPlantSpace: number | null;
  plantedDensity: number | null;
  realizedPlants: number | null;
};

type ViewGroups = {
  planned: boolean;
  actual: boolean;
};

type Props = {
  cropDataId: string;
  farmId: string;
  initialData: Record<string, unknown> | null;
  fallbackCrop?: string | null;
  fallbackVariety?: string | null;
  maxRows?: number | null;
  contractId?: string | null;
  plantingOrder?: PlantingDirection | null;
  nextRowOrder?: PlantingDirection | null;
};

type SummaryRow = {
  key: string;
  crop: string;
  cropVariety: string;
  gender: Gender;
  plannedMeters: number | null;
  plannedPlants: number | null;
  plannedPlantSpace: number | null;
  plannedDensity: number | null;
  plannedRows: number;
  plantedMeters: number | null;
  plantedPlants: number | null;
  plantedPlantSpace: number | null;
  plantedDensity: number | null;
  plantedRows: number;
  realizedPlants: number | null;
  realizedPlantSpace: number | null;
  realizedDensity: number | null;
  realizedRows: number;
};

const MODULE_TYPE = "planting_records";
const DEFAULT_ROW_COUNT = 10;
const DEFAULT_METERS = 55;
const DEFAULT_PLANT_SPACE = 10;
const DEFAULT_PLANTS = 20;

function newId() {
  return Math.random().toString(36).slice(2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function num(value: unknown) {
  return toNum(value);
}

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function gender(value: unknown): Gender {
  return value === "Female" ? "Female" : "Male";
}

function status(value: unknown): EntryStatus {
  return value === "Planted" ? "Planted" : "Planned";
}

function density(plants: number | null, meters: number | null) {
  if (!plants || !meters) return null;
  return plants / meters;
}

function parseEntry(
  row: unknown,
  index: number,
  fallbackCrop?: string | null,
  fallbackVariety?: string | null
): PlantingEntry {
  const value = isRecord(row) ? row : {};
  const plannedPlants = num(value.plannedPlants ?? value.noOfPlants);
  const plannedMeters = num(value.plannedMeters ?? value.m2PerRow);
  const plantedPlants = num(value.plantedPlants ?? value.noOfPlants);
  const plantedMeters = num(value.plantedMeters ?? value.actualM2PerRow);
  return {
    id: str(value.id, newId()),
    rowNo: num(value.rowNo ?? value.rowNumber) ?? index + 1,
    crop: str(value.crop, fallbackCrop ?? ""),
    cropVariety: str(value.cropVariety ?? value.variety, fallbackVariety ?? ""),
    gender: gender(value.gender ?? value.type),
    status: status(value.status ?? (value.planted ? "Planted" : "Planned")),
    plannedMeters,
    plannedPlants,
    plannedPlantSpace: num(value.plannedPlantSpace ?? value.plantingSpaceCm),
    plannedDensity:
      num(value.plannedDensity ?? value.density) ?? density(plannedPlants, plannedMeters),
    plantedMeters,
    plantedPlants,
    plantedPlantSpace: num(value.plantedPlantSpace ?? value.plantingSpaceCm),
    plantedDensity:
      num(value.plantedDensity ?? value.density) ?? density(plantedPlants, plantedMeters),
    realizedPlants: num(value.realizedPlants),
  };
}

function initialEntries(
  data: Record<string, unknown> | null,
  fallbackCrop?: string | null,
  fallbackVariety?: string | null
) {
  const raw = Array.isArray(data?.entries)
    ? data.entries
    : Array.isArray(data?.rows)
      ? data.rows
      : [];
  if (raw.length > 0) {
    return raw.map((row, index) => parseEntry(row, index, fallbackCrop, fallbackVariety));
  }
  return Array.from({ length: DEFAULT_ROW_COUNT }, (_, index) => {
    const plannedPlants = index < 2 || (index >= 4 && index <= 6) ? DEFAULT_PLANTS : null;
    const plannedMeters = DEFAULT_METERS;
    const plantedMeters = plannedPlants ? DEFAULT_PLANT_SPACE : null;
    return {
      id: newId(),
      rowNo: index + 1,
      crop: fallbackCrop ?? "",
      cropVariety: fallbackVariety ?? "",
      gender: index < 2 ? "Female" : "Male",
      status: plannedPlants ? "Planted" : "Planned",
      plannedMeters,
      plannedPlants,
      plannedPlantSpace: plannedPlants ? DEFAULT_PLANT_SPACE : null,
      plannedDensity: density(plannedPlants, plannedMeters),
      plantedMeters,
      plantedPlants: plannedPlants,
      plantedPlantSpace: plannedPlants ? DEFAULT_PLANT_SPACE : null,
      plantedDensity: density(plannedPlants, plantedMeters),
      realizedPlants: null,
    } satisfies PlantingEntry;
  });
}

function initialViewGroups(data: Record<string, unknown> | null): ViewGroups {
  const groups = isRecord(data?.viewGroups) ? data.viewGroups : {};
  return {
    planned: groups.planned !== false,
    actual: groups.actual !== false,
  };
}

function sortedEntries(entries: PlantingEntry[], direction: PlantingDirection | null | undefined) {
  const withIndex = entries.map((entry, index) => ({ entry, index }));
  withIndex.sort((a, b) => {
    const order = a.entry.rowNo - b.entry.rowNo;
    return order === 0 ? a.index - b.index : order;
  });
  if (direction === "bottom-top" || direction === "right-left") withIndex.reverse();
  return withIndex.map((item) => item.entry);
}

function sum(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return present.reduce((total, value) => total + value, 0);
}

function avg(values: Array<number | null>) {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return present.reduce((total, value) => total + value, 0) / present.length;
}

function countRows(entries: PlantingEntry[], metric: keyof PlantingEntry) {
  return new Set(entries.filter((entry) => entry[metric] !== null).map((entry) => entry.rowNo))
    .size;
}

function summarize(entries: PlantingEntry[]): SummaryRow[] {
  const groups = new Map<string, PlantingEntry[]>();
  for (const entry of entries) {
    const key = `${entry.crop}|${entry.cropVariety}|${entry.gender}`;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return Array.from(groups.entries()).map(([key, rows]) => {
    const first = rows[0]!;
    return {
      key,
      crop: first.crop,
      cropVariety: first.cropVariety,
      gender: first.gender,
      plannedMeters: sum(rows.map((row) => row.plannedMeters)),
      plannedPlants: sum(rows.map((row) => row.plannedPlants)),
      plannedPlantSpace: avg(rows.map((row) => row.plannedPlantSpace)),
      plannedDensity: avg(rows.map((row) => row.plannedDensity)),
      plannedRows: countRows(rows, "plannedPlants"),
      plantedMeters: sum(rows.map((row) => row.plantedMeters)),
      plantedPlants: sum(rows.map((row) => row.plantedPlants)),
      plantedPlantSpace: avg(rows.map((row) => row.plantedPlantSpace)),
      plantedDensity: avg(rows.map((row) => row.plantedDensity)),
      plantedRows: countRows(rows, "plantedPlants"),
      realizedPlants: sum(rows.map((row) => row.realizedPlants)),
      realizedPlantSpace: avg(rows.map((row) => row.plantedPlantSpace)),
      realizedDensity: avg(rows.map((row) => row.plantedDensity)),
      realizedRows: countRows(rows, "realizedPlants"),
    };
  });
}

function display(value: number | null, digits = 2) {
  return value === null ? "-" : fmtNum(value, digits);
}

function inputValue(value: number | null) {
  return value ?? "";
}

function plantDots(count: number | null) {
  return Math.max(0, Math.min(40, Math.round(count ?? 0)));
}

export function PlantingData({
  cropDataId,
  farmId,
  initialData,
  fallbackCrop,
  fallbackVariety,
  maxRows,
  contractId,
  plantingOrder,
  nextRowOrder,
}: Props) {
  const [subtab, setSubtab] = useState<PlantingSubtab>("summary");
  const [entries, setEntries] = useState<PlantingEntry[]>(() =>
    initialEntries(initialData, fallbackCrop, fallbackVariety)
  );
  const [viewGroups, setViewGroups] = useState<ViewGroups>(() => initialViewGroups(initialData));
  const mutation = useUpdateModule(cropDataId, farmId, MODULE_TYPE);

  const detailEntries = useMemo(
    () => sortedEntries(entries, subtab === "visual" ? nextRowOrder : "top-bottom"),
    [entries, nextRowOrder, subtab]
  );
  const summaryRows = useMemo(() => summarize(sortedEntries(entries, "top-bottom")), [entries]);
  const visualRows = useMemo(() => {
    const grouped = new Map<number, PlantingEntry[]>();
    for (const entry of sortedEntries(entries, nextRowOrder)) {
      grouped.set(entry.rowNo, [...(grouped.get(entry.rowNo) ?? []), entry]);
    }
    return Array.from(grouped.entries());
  }, [entries, nextRowOrder]);

  function patchEntry(id: string, patch: Partial<PlantingEntry>) {
    setEntries((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        const next = { ...entry, ...patch };
        return {
          ...next,
          plannedDensity: density(next.plannedPlants, next.plannedMeters),
          plantedDensity: density(next.plantedPlants, next.plantedMeters),
        };
      })
    );
  }

  function addEntry() {
    const nextRow = entries.reduce((max, entry) => Math.max(max, entry.rowNo), 0) + 1;
    if (maxRows && nextRow > maxRows) {
      toast.error(`This block only has ${maxRows} rows.`);
      return;
    }
    setEntries((current) => [
      ...current,
      {
        id: newId(),
        rowNo: nextRow,
        crop: fallbackCrop ?? "",
        cropVariety: fallbackVariety ?? "",
        gender: "Female",
        status: "Planned",
        plannedMeters: DEFAULT_METERS,
        plannedPlants: null,
        plannedPlantSpace: null,
        plannedDensity: null,
        plantedMeters: null,
        plantedPlants: null,
        plantedPlantSpace: null,
        plantedDensity: null,
        realizedPlants: null,
      },
    ]);
    setSubtab("detail");
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  async function saveEntries() {
    if (!contractId) {
      toast.error("Link this crop data record to a contract before saving planting rows.");
      return;
    }
    const invalid = entries.find((entry) => maxRows && entry.rowNo > maxRows);
    if (invalid) {
      toast.error(`Row ${invalid.rowNo} is outside the selected block row limit of ${maxRows}.`);
      return;
    }
    try {
      await mutation.mutateAsync({
        entries: sortedEntries(entries, "top-bottom"),
        viewGroups,
      });
      toast.success("Planting data saved");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save planting data");
    }
  }

  const headerButton = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={subtab === "summary" ? "secondary" : "ghost"}
        onClick={() => setSubtab("summary")}
      >
        Summary
      </Button>
      <Button
        type="button"
        size="sm"
        variant={subtab === "detail" ? "secondary" : "ghost"}
        onClick={() => setSubtab("detail")}
      >
        <Grid3X3 className="mr-1.5 h-4 w-4" />
        Detail
      </Button>
      <Button
        type="button"
        size="sm"
        variant={subtab === "visual" ? "secondary" : "ghost"}
        onClick={() => setSubtab("visual")}
      >
        <Eye className="mr-1.5 h-4 w-4" />
        Visual
      </Button>
      <Button type="button" size="sm" onClick={addEntry}>
        <Plus className="mr-1.5 h-4 w-4" />
        New Entry
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={saveEntries}>
        <Save className="mr-1.5 h-4 w-4" />
        Save
      </Button>
    </div>
  );

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
                Track planting summary, detail rows, and row-level visualization.
              </p>
            </div>
          </div>
          {headerButton}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-5 rounded-lg border bg-card px-5 py-3 text-sm">
        <span className="font-semibold">View</span>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={viewGroups.planned}
            onCheckedChange={(value) =>
              setViewGroups((current) => ({ ...current, planned: value === true }))
            }
          />
          Planned
        </label>
        <label className="flex items-center gap-2">
          <Checkbox
            checked={viewGroups.actual}
            onCheckedChange={(value) =>
              setViewGroups((current) => ({ ...current, actual: value === true }))
            }
          />
          Planted + Realized
        </label>
        {maxRows ? (
          <span className="ml-auto text-muted-foreground">Block row limit: {maxRows}</span>
        ) : (
          <span className="ml-auto flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4" />
            Link a contract with a block to validate row limits.
          </span>
        )}
      </div>

      {subtab === "summary" ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-300 text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="border-r px-3 py-2 text-left" colSpan={3}>
                  Planting Summary
                </th>
                {viewGroups.planned ? (
                  <th className="border-r px-3 py-2 text-center" colSpan={5}>
                    Planned
                  </th>
                ) : null}
                {viewGroups.actual ? (
                  <>
                    <th className="border-r px-3 py-2 text-center" colSpan={5}>
                      Planted
                    </th>
                    <th className="px-3 py-2 text-center" colSpan={5}>
                      Realized
                    </th>
                  </>
                ) : null}
              </tr>
              <tr>
                <th className="px-3 py-2 text-left">Crop</th>
                <th className="px-3 py-2 text-left">Variety</th>
                <th className="px-3 py-2 text-left">Gender</th>
                {viewGroups.planned ? (
                  <>
                    <th className="px-3 py-2 text-left">Meters</th>
                    <th className="px-3 py-2 text-left">No of Plants</th>
                    <th className="px-3 py-2 text-left">Plant Space</th>
                    <th className="px-3 py-2 text-left">Density</th>
                    <th className="px-3 py-2 text-left">No of Rows</th>
                  </>
                ) : null}
                {viewGroups.actual ? (
                  <>
                    <th className="px-3 py-2 text-left">Meters</th>
                    <th className="px-3 py-2 text-left">No of Plants</th>
                    <th className="px-3 py-2 text-left">Plant Space</th>
                    <th className="px-3 py-2 text-left">Density</th>
                    <th className="px-3 py-2 text-left">No of Rows</th>
                    <th className="px-3 py-2 text-left">Meters</th>
                    <th className="px-3 py-2 text-left">No of Plants</th>
                    <th className="px-3 py-2 text-left">Plant Space</th>
                    <th className="px-3 py-2 text-left">Density</th>
                    <th className="px-3 py-2 text-left">No of Rows</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((row) => (
                <tr key={row.key} className="border-t">
                  <td className="px-3 py-3 font-medium">{row.crop || "-"}</td>
                  <td className="px-3 py-3">{row.cropVariety || "-"}</td>
                  <td className="px-3 py-3">{row.gender}</td>
                  {viewGroups.planned ? (
                    <>
                      <td className="px-3 py-3">{display(row.plannedMeters)}</td>
                      <td className="px-3 py-3">{display(row.plannedPlants, 0)}</td>
                      <td className="px-3 py-3">{display(row.plannedPlantSpace)}</td>
                      <td className="px-3 py-3">{display(row.plannedDensity)}</td>
                      <td className="px-3 py-3">{row.plannedRows || "-"}</td>
                    </>
                  ) : null}
                  {viewGroups.actual ? (
                    <>
                      <td className="px-3 py-3">{display(row.plantedMeters)}</td>
                      <td className="px-3 py-3">{display(row.plantedPlants, 0)}</td>
                      <td className="px-3 py-3">{display(row.plantedPlantSpace)}</td>
                      <td className="px-3 py-3">{display(row.plantedDensity)}</td>
                      <td className="px-3 py-3">{row.plantedRows || "-"}</td>
                      <td className="px-3 py-3">{display(row.plantedMeters)}</td>
                      <td className="px-3 py-3">{display(row.realizedPlants, 0)}</td>
                      <td className="px-3 py-3">{display(row.realizedPlantSpace)}</td>
                      <td className="px-3 py-3">{display(row.realizedDensity)}</td>
                      <td className="px-3 py-3">{row.realizedRows || "-"}</td>
                    </>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {subtab === "detail" ? (
        <div className="overflow-x-auto rounded-lg border bg-card">
          <table className="w-full min-w-320 text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2 text-left" rowSpan={2}>
                  Row Number
                </th>
                <th className="px-3 py-2 text-left" rowSpan={2}>
                  Crop
                </th>
                <th className="px-3 py-2 text-left" rowSpan={2}>
                  Variety
                </th>
                <th className="px-3 py-2 text-left" rowSpan={2}>
                  Gender
                </th>
                <th className="px-3 py-2 text-left" rowSpan={2}>
                  Status
                </th>
                {viewGroups.planned ? (
                  <th className="px-3 py-2 text-center" colSpan={4}>
                    Planned
                  </th>
                ) : null}
                {viewGroups.actual ? (
                  <>
                    <th className="px-3 py-2 text-center" colSpan={4}>
                      Planted
                    </th>
                    <th className="px-3 py-2 text-center" colSpan={1}>
                      Realized
                    </th>
                  </>
                ) : null}
                <th className="px-3 py-2" rowSpan={2}></th>
              </tr>
              <tr>
                {viewGroups.planned ? (
                  <>
                    <th className="px-3 py-2 text-left">Meters</th>
                    <th className="px-3 py-2 text-left">No of Plants</th>
                    <th className="px-3 py-2 text-left">Plant Space</th>
                    <th className="px-3 py-2 text-left">Density</th>
                  </>
                ) : null}
                {viewGroups.actual ? (
                  <>
                    <th className="px-3 py-2 text-left">Meters</th>
                    <th className="px-3 py-2 text-left">No of Plants</th>
                    <th className="px-3 py-2 text-left">Plant Space</th>
                    <th className="px-3 py-2 text-left">Density</th>
                    <th className="px-3 py-2 text-left">No of Plants</th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {detailEntries.map((entry) => (
                <tr key={entry.id} className="border-t align-middle">
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 w-20"
                      type="number"
                      min={1}
                      max={maxRows ?? undefined}
                      value={inputValue(entry.rowNo)}
                      onChange={(event) =>
                        patchEntry(entry.id, { rowNo: Number(event.target.value) || entry.rowNo })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 w-32"
                      value={entry.crop}
                      onChange={(event) => patchEntry(entry.id, { crop: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-8 w-32"
                      value={entry.cropVariety}
                      onChange={(event) =>
                        patchEntry(entry.id, { cropVariety: event.target.value })
                      }
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={entry.gender}
                      onValueChange={(value) => patchEntry(entry.id, { gender: gender(value) })}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={entry.status}
                      onValueChange={(value) => patchEntry(entry.id, { status: status(value) })}
                    >
                      <SelectTrigger className="h-8 w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planned">Planned</SelectItem>
                        <SelectItem value="Planted">Planted</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  {viewGroups.planned ? (
                    <>
                      <NumberCell
                        value={entry.plannedMeters}
                        onChange={(value) => patchEntry(entry.id, { plannedMeters: value })}
                      />
                      <NumberCell
                        value={entry.plannedPlants}
                        onChange={(value) => patchEntry(entry.id, { plannedPlants: value })}
                      />
                      <NumberCell
                        value={entry.plannedPlantSpace}
                        onChange={(value) => patchEntry(entry.id, { plannedPlantSpace: value })}
                      />
                      <td className="px-3 py-2 font-medium">{display(entry.plannedDensity)}</td>
                    </>
                  ) : null}
                  {viewGroups.actual ? (
                    <>
                      <NumberCell
                        value={entry.plantedMeters}
                        onChange={(value) => patchEntry(entry.id, { plantedMeters: value })}
                      />
                      <NumberCell
                        value={entry.plantedPlants}
                        onChange={(value) => patchEntry(entry.id, { plantedPlants: value })}
                      />
                      <NumberCell
                        value={entry.plantedPlantSpace}
                        onChange={(value) => patchEntry(entry.id, { plantedPlantSpace: value })}
                      />
                      <td className="px-3 py-2 font-medium">{display(entry.plantedDensity)}</td>
                      <NumberCell
                        value={entry.realizedPlants}
                        onChange={(value) => patchEntry(entry.id, { realizedPlants: value })}
                      />
                    </>
                  ) : null}
                  <td className="px-3 py-2 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {subtab === "visual" ? (
        <div className="overflow-x-auto rounded-lg border border-primary/20 bg-emerald-50 p-4">
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm font-medium text-emerald-950">
            <span>{fallbackCrop ?? "Crop"}</span>
            <span className="text-muted-foreground">Rows: {visualRows.length}</span>
            <span className="text-muted-foreground">
              Plants: {sum(entries.map((entry) => entry.plantedPlants)) ?? 0}
            </span>
          </div>
          <div className="min-w-220 rounded-lg border border-emerald-900/20 bg-emerald-100 p-3">
            {visualRows.map(([rowNo, rowEntries]) => (
              <div key={rowNo} className="mb-2 flex items-center gap-2 rounded-md bg-white/75 p-2">
                <span className="w-12 rounded bg-primary px-2 py-1 text-center text-xs font-semibold text-primary-foreground">
                  R{rowNo}
                </span>
                <div
                  className={
                    plantingOrder === "right-left" || plantingOrder === "bottom-top"
                      ? "flex flex-1 flex-row-reverse gap-1"
                      : "flex flex-1 gap-1"
                  }
                >
                  {rowEntries.flatMap((entry) =>
                    Array.from(
                      { length: plantDots(entry.plantedPlants ?? entry.plannedPlants) },
                      (_, index) => (
                        <span
                          key={`${entry.id}-${index}`}
                          title={`R${entry.rowNo} ${entry.crop} ${entry.cropVariety} ${entry.gender}`}
                          className={
                            entry.gender === "Female"
                              ? "h-3 w-3 rounded-full bg-emerald-500"
                              : "h-3 w-3 rounded-full bg-sky-500"
                          }
                        />
                      )
                    )
                  )}
                  {rowEntries.every((entry) => !entry.plantedPlants && !entry.plannedPlants) ? (
                    <span className="text-xs text-muted-foreground">Unassigned</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md bg-emerald-900 px-4 py-2 text-xs font-medium text-white">
            <span>FIELD LEGEND</span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-emerald-500" />
              Female
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-3 w-3 rounded-full bg-sky-500" />
              Male
            </span>
            <span>Unassigned</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function NumberCell({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <td className="px-3 py-2">
      <Input
        className="h-8 w-24"
        type="number"
        step="any"
        value={inputValue(value)}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      />
    </td>
  );
}
