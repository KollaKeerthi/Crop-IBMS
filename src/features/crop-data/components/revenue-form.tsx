"use client";

import { MetricForm, type MetricRow, type Vals } from "./metric-form";
import { DollarSign } from "lucide-react";
import { UpdateRevenueInputSchema, type UpdateRevenueInput } from "../schema";
import { useUpdateRevenue } from "../hooks";
import { fmtNum, revenueSide } from "../compute";

const ROWS: MetricRow[] = [
  {
    kind: "mf",
    label: "Total number of Weeks",
    type: "int",
    male: "maleTotalWeeks",
    female: "femaleTotalWeeks",
  },
  {
    kind: "mf",
    label: "Agreed Unit Price",
    type: "number",
    male: "maleAgreedUnitPrice",
    female: "femaleAgreedUnitPrice",
  },
  {
    kind: "computed-mf",
    label: "Contract Revenue",
    computeMale: (v, ctx) => fmtNum(revenueSide(v, ctx, "male").contractRevenue, 3),
    computeFemale: (v, ctx) => fmtNum(revenueSide(v, ctx, "female").contractRevenue, 3),
  },
  { kind: "single", label: "Additional Revenue", type: "number", name: "additionalRevenue" },
  {
    kind: "computed-mf",
    label: "Total Revenue",
    computeMale: (v, ctx) => fmtNum(revenueSide(v, ctx, "male").totalRevenue, 3),
    computeFemale: (v, ctx) => fmtNum(revenueSide(v, ctx, "female").totalRevenue, 3),
  },
  {
    kind: "computed-mf",
    label: "Total Revenue m2",
    computeMale: (v, ctx) => fmtNum(revenueSide(v, ctx, "male").totalRevenuePerSqm, 9),
    computeFemale: (v, ctx) => fmtNum(revenueSide(v, ctx, "female").totalRevenuePerSqm, 9),
  },
  {
    kind: "computed-mf",
    label: "Total Revenue m2/wk",
    computeMale: (v, ctx) => fmtNum(revenueSide(v, ctx, "male").totalRevenuePerSqmWk, 9),
    computeFemale: (v, ctx) => fmtNum(revenueSide(v, ctx, "female").totalRevenuePerSqmWk, 9),
  },
  {
    kind: "single",
    label: "Planned Remarks",
    type: "textarea",
    name: "plannedRemarks",
    placement: "span",
  },
  {
    kind: "single",
    label: "Actual Remarks",
    type: "textarea",
    name: "actualRemarks",
    placement: "span",
  },
];

type Props = {
  cropDataId: string;
  farmId: string;
  revenue: Vals | null;
  /** Program Info record - supplies agreed order kg + surface area for revenue math. */
  programInfo: Vals | null;
};

export function RevenueForm({ cropDataId, farmId, revenue, programInfo }: Props) {
  const mutation = useUpdateRevenue(cropDataId, farmId);
  return (
    <MetricForm
      title="Revenue Projections"
      description="Track and manage financial metrics and projections."
      icon={<DollarSign className="h-4 w-4" />}
      editLabel="Edit Financials"
      rows={ROWS}
      initial={revenue}
      schema={UpdateRevenueInputSchema}
      computeContext={programInfo ?? {}}
      columnLabels={{ left: "Planned", right: "Actual" }}
      isSaving={mutation.isPending}
      onSave={(values) => mutation.mutateAsync(values as UpdateRevenueInput)}
    />
  );
}
