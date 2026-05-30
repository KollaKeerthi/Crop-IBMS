"use client";

import { useMemo } from "react";
import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import { UpdateNurseryInputSchema, NURSERY_DATE_FIELDS, type UpdateNurseryInput } from "../schema";
import { useUpdateNursery } from "../hooks";
import { computeNurseryDerivedFields, toNum, fmtNum } from "../compute";

const ROWS: MetricRow[] = [
  {
    kind: "mf",
    label: "Actual Sowing Date",
    type: "date",
    male: "maleActualSowingDate",
    female: "femaleActualSowingDate",
  },
  {
    kind: "mf",
    label: "Germination (%)",
    type: "number",
    male: "maleGerminationPct",
    female: "femaleGerminationPct",
    suffix: "%",
  },
  {
    kind: "mf",
    label: "Actual Planting Date",
    type: "date",
    male: "maleActualPlantingDate",
    female: "femaleActualPlantingDate",
  },
  { kind: "single", label: "Actual Planting Week", type: "int", name: "actualPlantingWeek" },
  {
    kind: "mf",
    label: "Actual No. of Plants Planted",
    type: "int",
    male: "maleActualPlantsPlanted",
    female: "femaleActualPlantsPlanted",
  },
  {
    kind: "mf",
    label: "Actual Plants / Row Planted",
    type: "number",
    male: "maleActualPlantsPerRow",
    female: "femaleActualPlantsPerRow",
  },
  {
    kind: "computed-mf",
    label: "Actual No. of Rows Planted",
    computeMale: (v) => {
      const plants = toNum(v.maleActualPlantsPlanted);
      const perRow = toNum(v.maleActualPlantsPerRow);
      return fmtNum(plants === null || perRow === null || perRow === 0 ? null : plants / perRow);
    },
    computeFemale: (v) => {
      const plants = toNum(v.femaleActualPlantsPlanted);
      const perRow = toNum(v.femaleActualPlantsPerRow);
      return fmtNum(plants === null || perRow === null || perRow === 0 ? null : plants / perRow);
    },
  },
  {
    kind: "computed-mf",
    label: "Actual Surface Area Planted",
    computeMale: (v, ctx) => {
      const plants = toNum(v.maleActualPlantsPlanted);
      const plannedPlantsPerM2 = toNum(ctx?.malePlannedPlantsPerSqm);
      return fmtNum(plants === null || plannedPlantsPerM2 === null || plannedPlantsPerM2 === 0 ? null : plants / plannedPlantsPerM2);
    },
    computeFemale: (v, ctx) => {
      const plants = toNum(v.femaleActualPlantsPlanted);
      const plannedPlantsPerM2 = toNum(ctx?.femalePlannedPlantsPerSqm);
      return fmtNum(plants === null || plannedPlantsPerM2 === null || plannedPlantsPerM2 === 0 ? null : plants / plannedPlantsPerM2);
    },
  },
  {
    kind: "single",
    label: "Remarks from Customer",
    type: "textarea",
    name: "remarksFromCustomer",
  },
  {
    kind: "single",
    label: "Recommendations",
    type: "textarea",
    name: "recommendations",
  },
];

type Props = {
  cropDataId: string;
  farmId: string;
  nursery: Vals | null;
  programInfo: Vals | null;
};

export function NurseryForm({ cropDataId, farmId, nursery, programInfo }: Props) {
  const mutation = useUpdateNursery(cropDataId, farmId);
  const mergedInitial = useMemo(() => {
    const computed = computeNurseryDerivedFields(nursery ?? {}, programInfo);
    return { ...nursery, ...computed };
  }, [nursery, programInfo]);

  return (
    <MetricForm
      title="Nursery Status"
      rows={ROWS}
      initial={mergedInitial}
      schema={UpdateNurseryInputSchema}
      dateFields={NURSERY_DATE_FIELDS}
      computeContext={programInfo ?? {}}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values as UpdateNurseryInput)}
      onValuesChange={(vals) => computeNurseryDerivedFields(vals, programInfo) as Vals}
    />
  );
}
