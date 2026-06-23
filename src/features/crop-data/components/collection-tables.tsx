import { useMemo } from "react";
import { RowTableEditor, type RowColumn } from "./row-table-editor";
import type { Vals } from "./metric-form";
import {
  HarvestRecordInputSchema,
  PerformanceInputSchema,
  HARVEST_RECORD_DATE_FIELDS,
  PERFORMANCE_DATE_FIELDS,
} from "../schema";
import { useCollectionMutations } from "../hooks";
import { fmtNum, harvestGrPerM2, seedsQualityGerminationPct, toNum } from "../compute";

type Props = {
  cropDataId: string;
  farmId: string;
  rows: Vals[];
};

type HarvestProps = Props & {
  seedsQuality: Vals | null;
};

type PerformanceProps = Props & {
  harvestRows?: Vals[];
  blockAverage?: number | null;
};

// ---- Harvest Details ----
const HARVEST_COLUMNS: RowColumn[] = [
  { name: "harvestDate", label: "Date", type: "date" },
  { name: "block", label: "Block", type: "text" },
  { name: "variety", label: "Variety", type: "text" },
  { name: "code", label: "Code", type: "text" },
  { name: "rowM2", label: "Row m2", type: "number" },
  { name: "rowNo", label: "Row No", type: "int" },
  { name: "empName", label: "Emp Name", type: "text" },
  { name: "harvestCode", label: "Harvest Code", type: "text" },
  { name: "kg", label: "Kg", type: "number" },
  { name: "germinationPct", label: "% Germination", type: "number" },
  { name: "remarks", label: "Remarks", type: "text" },
];

export function HarvestDetailsTable({ cropDataId, farmId, rows, seedsQuality }: HarvestProps) {
  const mutations = useCollectionMutations(cropDataId, farmId, "harvest_records");

  const seedsG = useMemo(() => {
    return seedsQuality ? seedsQualityGerminationPct(seedsQuality) : null;
  }, [seedsQuality]);

  const mappedRows = useMemo(() => {
    return rows.map((r) => ({
      ...r,
      germinationPct:
        r.germinationPct !== null && r.germinationPct !== undefined && r.germinationPct !== ""
          ? r.germinationPct
          : seedsG,
    }));
  }, [rows, seedsG]);

  return (
    <RowTableEditor
      title="Harvest Details"
      columns={HARVEST_COLUMNS}
      computed={[{ label: "Gr/m2", compute: (r) => fmtNum(harvestGrPerM2(r)) }]}
      dateFields={HARVEST_RECORD_DATE_FIELDS}
      schema={HarvestRecordInputSchema}
      rows={mappedRows}
      mutations={mutations}
      defaultValues={{ germinationPct: seedsG ?? "" }}
    />
  );
}

// ---- Performance per person ----
const PERFORMANCE_COLUMNS: RowColumn[] = [
  { name: "date", label: "Date", type: "date" },
  { name: "empName", label: "Employee", type: "text" },
  { name: "activity", label: "Activity", type: "text" },
  { name: "outputQty", label: "Output", type: "number" },
  { name: "notes", label: "Notes", type: "text" },
];

function performanceTone(value: unknown, blockAverage: number | null) {
  const output = toNum(value);
  if (output === null || blockAverage === null) return "text-muted-foreground";
  if (output < blockAverage) return "text-destructive";
  if (output > blockAverage) return "text-primary";
  return "text-muted-foreground";
}

export function PerformanceTable({
  cropDataId,
  farmId,
  rows,
  harvestRows = [],
  blockAverage = null,
}: PerformanceProps) {
  const mutations = useCollectionMutations(cropDataId, farmId, "performance");
  const displayRows = useMemo(() => {
    if (rows.length > 0) return rows;
    return harvestRows.map((row, index) => ({
      id: row.id ?? `harvest-${index}`,
      date: row.harvestDate,
      empName: row.empName,
      activity: "Harvesting",
      outputQty: harvestGrPerM2(row),
      notes: row.remarks,
    }));
  }, [harvestRows, rows]);

  return (
    <RowTableEditor
      title="Performance Per Person"
      columns={PERFORMANCE_COLUMNS}
      computed={[
        {
          label: "Performance",
          compute: (row) => {
            const value = toNum(row.outputQty);
            if (value === null || blockAverage === null) return "-";
            if (value < blockAverage) return "Least";
            if (value > blockAverage) return "Best";
            return "Average";
          },
          className: (row) => performanceTone(row.outputQty, blockAverage),
        },
      ]}
      dateFields={PERFORMANCE_DATE_FIELDS}
      schema={PerformanceInputSchema}
      rows={displayRows}
      mutations={mutations}
      readOnly={rows.length === 0 && harvestRows.length > 0}
    />
  );
}
