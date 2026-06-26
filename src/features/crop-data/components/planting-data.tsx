"use client";

import { useMemo, useState } from "react";
import { AlertCircle, ArrowDownUp, Eye, Grid3X3, Plus, Save, Shuffle, Trash2 } from "lucide-react";
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
  plantCapacity?: number | null;
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
  realizedMeters: number | null;
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

function plantCount(entry: PlantingEntry) {
  return entry.plannedPlants ?? entry.plantedPlants ?? entry.realizedPlants ?? 0;
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

function initialSubtab(data: Record<string, unknown> | null): PlantingSubtab {
  return data?.selectedSubtab === "detail" || data?.selectedSubtab === "visual"
    ? data.selectedSubtab
    : "summary";
}

function sortEntries(entries: PlantingEntry[]) {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const rowOrder = left.entry.rowNo - right.entry.rowNo;
      return rowOrder === 0 ? left.index - right.index : rowOrder;
    })
    .map((item) => item.entry);
}

function directionalRows(
  entries: PlantingEntry[],
  direction: PlantingDirection | null | undefined
) {
  const grouped = new Map<number, PlantingEntry[]>();
  for (const entry of sortEntries(entries)) {
    grouped.set(entry.rowNo, [...(grouped.get(entry.rowNo) ?? []), entry]);
  }
  const rows = Array.from(grouped.entries());
  if (direction === "bottom-top" || direction === "right-left") rows.reverse();
  return rows;
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
      realizedMeters: sum(rows.map((row) => row.plantedMeters)),
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

function rowCapacityError(entries: PlantingEntry[], plantCapacity: number | null | undefined) {
  if (!plantCapacity) return null;
  const totals = new Map<number, number>();
  for (const entry of entries) {
    totals.set(entry.rowNo, (totals.get(entry.rowNo) ?? 0) + plantCount(entry));
  }
  for (const [rowNo, total] of totals) {
    if (total > plantCapacity) {
      return `Row ${rowNo} can fit ${plantCapacity} plants. Current entries use ${total}.`;
    }
  }
  return null;
}

function moveWithinRow(entries: PlantingEntry[], draggedId: string, targetId: string) {
  if (draggedId === targetId) return entries;
  const dragged = entries.find((entry) => entry.id === draggedId);
  const target = entries.find((entry) => entry.id === targetId);
  if (!dragged || !target || dragged.rowNo !== target.rowNo) return entries;

  const others = entries.filter((entry) => entry.id !== draggedId);
  const targetIndex = others.findIndex((entry) => entry.id === targetId);
  if (targetIndex < 0) return entries;

  return [...others.slice(0, targetIndex), dragged, ...others.slice(targetIndex)];
}

export function PlantingData({
  cropDataId,
  farmId,
  initialData,
  fallbackCrop,
  fallbackVariety,
  maxRows,
  plantCapacity,
  contractId,
  plantingOrder,
  nextRowOrder,
}: Props) {
  const [subtab, setSubtab] = useState<PlantingSubtab>(() => initialSubtab(initialData));
  const [showBulkFill, setShowBulkFill] = useState(false);
  const [fillFromRow, setFillFromRow] = useState(1);
  const [fillToStart, setFillToStart] = useState(1);
  const [fillToEnd, setFillToEnd] = useState(10);
  const [draggedEntryId, setDraggedEntryId] = useState<string | null>(null);
  const [entries, setEntries] = useState<PlantingEntry[]>(() =>
    initialEntries(initialData, fallbackCrop, fallbackVariety)
  );
  const [viewGroups, setViewGroups] = useState<ViewGroups>(() => initialViewGroups(initialData));
  const mutation = useUpdateModule(cropDataId, farmId, MODULE_TYPE);

  const detailEntries = useMemo(() => sortEntries(entries), [entries]);
  const summaryRows = useMemo(() => summarize(sortEntries(entries)), [entries]);
  const visualRows = useMemo(() => directionalRows(entries, nextRowOrder), [entries, nextRowOrder]);

  function setTab(next: PlantingSubtab) {
    setSubtab(next);
    if (next !== "detail") setShowBulkFill(false);
  }

  function patchEntry(id: string, patch: Partial<PlantingEntry>) {
    setEntries((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry;
        const next = { ...entry, ...patch };
        return {
          ...next,
          crop: fallbackCrop ?? next.crop,
          cropVariety: fallbackVariety ?? next.cropVariety,
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
    setEntries((current) =>
      sortEntries([
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
      ])
    );
    setTab("detail");
  }

  function removeEntry(id: string) {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  }

  function fillRows() {
    const sourceEntries = sortEntries(entries).filter((entry) => entry.rowNo === fillFromRow);
    if (sourceEntries.length === 0) {
      toast.error(`Row ${fillFromRow} has no entries to fill from.`);
      return;
    }
    if (fillToStart > fillToEnd) {
      toast.error("Fill to start row must be before the end row.");
      return;
    }
    if (maxRows && fillToEnd > maxRows) {
      toast.error(`This block only has ${maxRows} rows.`);
      return;
    }
    const rows = Array.from(
      { length: fillToEnd - fillToStart + 1 },
      (_, index) => fillToStart + index
    );
    const cloned = rows.flatMap((rowNo) =>
      sourceEntries.map((entry) => ({
        ...entry,
        id: newId(),
        rowNo,
      }))
    );
    setEntries((current) => {
      const untouched = current.filter((entry) => !rows.includes(entry.rowNo));
      return sortEntries([...untouched, ...cloned]);
    });
    toast.success("Rows filled");
  }

  async function saveEntries() {
    const invalid = entries.find((entry) => maxRows && entry.rowNo > maxRows);
    if (invalid) {
      toast.error(`Row ${invalid.rowNo} is outside the selected block row limit of ${maxRows}.`);
      return;
    }
    const capacityError = rowCapacityError(entries, plantCapacity);
    if (capacityError) {
      toast.error(capacityError);
      return;
    }
    try {
      await mutation.mutateAsync({
        entries: sortEntries(entries),
        viewGroups,
        selectedSubtab: subtab,
      });
      if (!contractId) {
        toast.warning("Saved with warning: contract linkage is required for reliable conflicts.");
      } else {
        toast.success("Planting data saved");
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save planting data");
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
                Track planting summary, detail rows, and row-level visualization.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={subtab === "summary" ? "secondary" : "ghost"}
              onClick={() => setTab("summary")}
            >
              Planting Summary
            </Button>
            <Button
              type="button"
              size="sm"
              variant={subtab === "detail" ? "secondary" : "ghost"}
              onClick={() => setTab("detail")}
            >
              <Grid3X3 className="mr-1.5 h-4 w-4" />
              Planting Detail
            </Button>
            <Button
              type="button"
              size="sm"
              variant={subtab === "visual" ? "secondary" : "ghost"}
              onClick={() => setTab("visual")}
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Visual
            </Button>
            <Button
              type="button"
              size="sm"
              variant={showBulkFill ? "secondary" : "outline"}
              onClick={() => {
                setSubtab("detail");
                setShowBulkFill((value) => !value);
              }}
            >
              <Shuffle className="mr-1.5 h-4 w-4" />
              Bulk Fill Selection
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
          <span className="ml-auto text-muted-foreground">
            Block row limit: {maxRows}
            {plantCapacity ? ` / ${plantCapacity} plants per row` : ""}
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-4 w-4" />
            Link a contract with a block to validate row limits.
          </span>
        )}
      </div>

      {showBulkFill && subtab === "detail" ? (
        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-base font-semibold">Bulk Fill Selection</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Fill crop, variety, gender, row length, plant count, spacing, and density inputs from
            one row into a selected row range.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end">
            <label className="space-y-2 text-sm font-medium">
              Fill from
              <Input
                type="number"
                min={1}
                max={maxRows ?? undefined}
                value={fillFromRow}
                placeholder="Row number"
                onChange={(event) => setFillFromRow(Number(event.target.value) || 1)}
              />
            </label>
            <div className="space-y-2">
              <span className="text-sm font-medium">Fill to</span>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min={1}
                  max={maxRows ?? undefined}
                  value={fillToStart}
                  placeholder="1"
                  onChange={(event) => setFillToStart(Number(event.target.value) || 1)}
                />
                <Input
                  type="number"
                  min={1}
                  max={maxRows ?? undefined}
                  value={fillToEnd}
                  placeholder="10"
                  onChange={(event) => setFillToEnd(Number(event.target.value) || 1)}
                />
              </div>
            </div>
            <Button type="button" onClick={fillRows}>
              <ArrowDownUp className="mr-1.5 h-4 w-4" />
              Fill
            </Button>
          </div>
        </div>
      ) : null}

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
                {viewGroups.planned ? <MetricHead /> : null}
                {viewGroups.actual ? (
                  <>
                    <MetricHead />
                    <MetricHead />
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
                    <MetricCells
                      meters={row.plannedMeters}
                      plants={row.plannedPlants}
                      plantSpace={row.plannedPlantSpace}
                      densityValue={row.plannedDensity}
                      rows={row.plannedRows}
                    />
                  ) : null}
                  {viewGroups.actual ? (
                    <>
                      <MetricCells
                        meters={row.plantedMeters}
                        plants={row.plantedPlants}
                        plantSpace={row.plantedPlantSpace}
                        densityValue={row.plantedDensity}
                        rows={row.plantedRows}
                      />
                      <MetricCells
                        meters={row.realizedMeters}
                        plants={row.realizedPlants}
                        plantSpace={row.realizedPlantSpace}
                        densityValue={row.realizedDensity}
                        rows={row.realizedRows}
                      />
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
                    <Input className="h-8 w-32" value={entry.crop} readOnly />
                  </td>
                  <td className="px-3 py-2">
                    <Input className="h-8 w-32" value={entry.cropVariety} readOnly />
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
              Plants: {sum(entries.map((entry) => entry.plantedPlants ?? entry.plannedPlants)) ?? 0}
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
                      ? "flex flex-1 flex-row-reverse gap-2"
                      : "flex flex-1 gap-2"
                  }
                >
                  {rowEntries.map((entry) => {
                    const dots = plantDots(entry.plantedPlants ?? entry.plannedPlants);
                    return (
                      <div
                        key={entry.id}
                        draggable
                        onDragStart={() => setDraggedEntryId(entry.id)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (!draggedEntryId) return;
                          setEntries((current) => moveWithinRow(current, draggedEntryId, entry.id));
                          setDraggedEntryId(null);
                        }}
                        title={`R${entry.rowNo} ${entry.crop} ${entry.cropVariety} ${entry.gender}`}
                        className="flex cursor-move items-center gap-1 rounded-md border bg-background/80 px-2 py-1"
                      >
                        {dots > 0 ? (
                          Array.from({ length: dots }, (_, index) => (
                            <span
                              key={`${entry.id}-${index}`}
                              className={
                                entry.gender === "Female"
                                  ? "h-3 w-3 rounded-full bg-emerald-500"
                                  : "h-3 w-3 rounded-full bg-sky-500"
                              }
                            />
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    );
                  })}
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

function MetricHead() {
  return (
    <>
      <th className="px-3 py-2 text-left">Meters</th>
      <th className="px-3 py-2 text-left">No of Plants</th>
      <th className="px-3 py-2 text-left">Plant Space</th>
      <th className="px-3 py-2 text-left">Density</th>
      <th className="px-3 py-2 text-left">No of Rows</th>
    </>
  );
}

function MetricCells({
  meters,
  plants,
  plantSpace,
  densityValue,
  rows,
}: {
  meters: number | null;
  plants: number | null;
  plantSpace: number | null;
  densityValue: number | null;
  rows: number;
}) {
  return (
    <>
      <td className="px-3 py-3">{display(meters)}</td>
      <td className="px-3 py-3">{display(plants, 0)}</td>
      <td className="px-3 py-3">{display(plantSpace)}</td>
      <td className="px-3 py-3">{display(densityValue)}</td>
      <td className="px-3 py-3">{rows || "-"}</td>
    </>
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
