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
import { fmtNum, harvestGrPerM2, seedsQualityGerminationPct } from "../compute";

type Props = {
  cropDataId: string;
  farmId: string;
  rows: Vals[];
};

type HarvestProps = Props & {
  seedsQuality: Vals | null;
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

export function PerformanceTable({ cropDataId, farmId, rows }: Props) {
  const mutations = useCollectionMutations(cropDataId, farmId, "performance");
  return (
    <RowTableEditor
      title="Performance Per Person"
      columns={PERFORMANCE_COLUMNS}
      dateFields={PERFORMANCE_DATE_FIELDS}
      schema={PerformanceInputSchema}
      rows={rows}
      mutations={mutations}
    />
  );
}
