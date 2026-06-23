"use client";

import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import {
  UpdateProgramInfoInputSchema,
  PROGRAM_INFO_DATE_FIELDS,
  type UpdateProgramInfoInput,
} from "../schema";
import { useUpdateProgramInfo } from "../hooks";
import { computeProgramInfoDerivedFields } from "../compute";

const ROWS: MetricRow[] = [
  { kind: "mf", label: "Batch Number", type: "text", male: "maleBatchNo", female: "femaleBatchNo" },
  {
    kind: "mf",
    label: "Planned Sowing Date",
    type: "date",
    male: "malePlannedSowingDate",
    female: "femalePlannedSowingDate",
  },
  {
    kind: "mf",
    label: "Planned Planting Date",
    type: "date",
    male: "malePlannedPlantingDate",
    female: "femalePlannedPlantingDate",
  },
  {
    kind: "mf",
    label: "Planned No. of Plants",
    type: "int",
    male: "malePlannedPlants",
    female: "femalePlannedPlants",
  },
  {
    kind: "mf",
    label: "Planned Plants / Row",
    type: "number",
    male: "malePlannedPlantsPerRow",
    female: "femalePlannedPlantsPerRow",
  },
  {
    kind: "mf",
    label: "Planned Plants / m2",
    type: "number",
    male: "malePlannedPlantsPerSqm",
    female: "femalePlannedPlantsPerSqm",
  },
  { kind: "single", label: "Planned Surface Area", type: "number", name: "plannedSurfaceArea" },
  { kind: "single", label: "Planned No. of Rows", type: "int", name: "plannedNoOfRows" },
  {
    kind: "single",
    label: "Proposed gram / Plant (Customer)",
    type: "number",
    name: "proposedGramPerPlant",
  },
  { kind: "single", label: "Agreed gram / Plant", type: "number", name: "agreedGramPerPlant" },
  { kind: "single", label: "Base Yield (kg)", type: "number", name: "baseYieldKg" },
  { kind: "single", label: "grams / m2", type: "number", name: "gramsPerSqm" },
  { kind: "subheader", label: "Schedule (Actual)" },
  {
    kind: "single",
    label: "Material Arrival Date",
    type: "date",
    name: "materialArrivalDate",
  },
  { kind: "single", label: "Block Prep Start", type: "date", name: "blockPrepStartDate" },
  { kind: "single", label: "Block Prep End", type: "date", name: "blockPrepEndDate" },
  { kind: "single", label: "Production Year", type: "int", name: "productionYear" },
  { kind: "subheader", label: "Order" },
  {
    kind: "mf",
    label: "Requested Quantity",
    type: "number",
    male: "maleRequestedQuantity",
    female: "femaleRequestedQuantity",
  },
  {
    kind: "single",
    label: "Agreed Order From NL (kg)",
    type: "number",
    name: "agreedOrderFromCustomerKg",
  },
  {
    kind: "single",
    label: "Requested Delivery Date (Customer)",
    type: "date",
    name: "requestedDeliveryDate",
  },
  { kind: "single", label: "Archive Status", type: "text", name: "archiveStatus" },
  {
    kind: "single",
    label: "Remarks From Customer",
    type: "textarea",
    name: "remarksFromCustomer",
    placement: "span",
  },
  { kind: "single", label: "Notes", type: "textarea", name: "notes", placement: "span" },
];

type Props = {
  cropDataId: string;
  farmId: string;
  programInfo: Vals | null;
};

export function ProgramInfoForm({ cropDataId, farmId, programInfo }: Props) {
  const mutation = useUpdateProgramInfo(cropDataId, farmId);
  return (
    <MetricForm
      title="Program Info"
      rows={ROWS}
      initial={programInfo}
      schema={UpdateProgramInfoInputSchema}
      dateFields={PROGRAM_INFO_DATE_FIELDS}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values as UpdateProgramInfoInput)}
      onValuesChange={computeProgramInfoDerivedFields}
    />
  );
}
