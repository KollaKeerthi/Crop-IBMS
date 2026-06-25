"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Box, Calendar, ChevronDown, ChevronUp, MapPin, Tag } from "lucide-react";
import { useFarm } from "@/lib/farm-context";
import { useCropDataDetail } from "@/features/crop-data/hooks";
import { CropDataDetail } from "@/features/crop-data/components/crop-data-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

type FullRecord = {
  id: string;
  farmId: string;
  cropName?: string | null;
  cropTypeName?: string | null;
  varietyName?: string | null;
  seasonName?: string | null;
  cropImageUrl?: string | null;
  locationBlockId?: string | null;
  locationBlockBoundary?: unknown;
  block?: string | null;
  fieldName?: string | null;
  fieldCode?: string | null;
  sexExpression?: string | null;
  contractNo?: string | null;
  headerNo?: string | null;
  customerCode?: string | null;
  contractRef?: string | null;
  status?: string | null;
  notes?: string | null;
  createdAt?: string;
  programInfo: Record<string, unknown> | null;
  nursery: Record<string, unknown> | null;
  revenue: Record<string, unknown> | null;
  sections: Record<string, Record<string, unknown> | null>;
  collections: Record<string, Record<string, unknown>[]>;
  media: Array<{
    id: string;
    url: string;
    name?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  }>;
  modules: Array<{ moduleType: string; data: Record<string, unknown> }>;
};

export function CropDataDetailPage({ activeTab }: { activeTab: string }) {
  const { id } = useParams<{ id: string }>();
  const { selectedFarmId } = useFarm();
  const { data, isLoading, isError } = useCropDataDetail(id, selectedFarmId);
  const [compact, setCompact] = useState(false);

  if (!selectedFarmId) {
    return <p className="p-8 text-sm text-muted-foreground">Select a farm to view crop data.</p>;
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full p-8">
        <p className="text-sm text-destructive">Crop data record not found.</p>
      </div>
    );
  }

  const record = data as FullRecord;
  const displayName = `${record.cropName ?? "Crop"} - ${record.varietyName ?? record.block ?? record.id.slice(0, 6)}`;
  const detailCode = record.customerCode ?? record.contractRef ?? record.id.slice(0, 6);
  const cropVarietyCode = [record.cropName, record.varietyName, detailCode]
    .filter(Boolean)
    .join("-");
  const breadcrumbText = ["Crop Data", record.block, cropVarietyCode].filter(Boolean).join(" / ");

  return (
    <div className="w-full space-y-4 px-6 pb-6 pt-4">
      <section className="border-b bg-background">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-md"
              render={<Link href="/dashboard/crop-data" />}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-semibold text-foreground">
              <span>{breadcrumbText}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCompact((value) => !value)}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            Compact View
            {compact ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>

        <div
          className={
            compact
              ? "flex flex-wrap items-center gap-4 pb-5"
              : "grid gap-8 pb-5 lg:grid-cols-[18rem_minmax(0,1fr)]"
          }
        >
          <div className="flex items-center gap-5">
            <div
              className={
                compact
                  ? "h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted"
                  : "h-28 w-28 shrink-0 overflow-hidden rounded-xl border bg-muted"
              }
            >
              {record.cropImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={record.cropImageUrl}
                  alt={record.cropName ?? "Crop"}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div>
              <div className="mb-2 w-fit rounded-md bg-primary/10 px-2 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Active Cycle
              </div>
              <h1
                className={
                  compact ? "text-lg font-bold tracking-tight" : "text-2xl font-bold tracking-tight"
                }
              >
                {displayName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Box className="h-4 w-4" />
                  {record.block ?? "-"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {record.seasonName ?? "-"}
                </span>
              </div>
            </div>
          </div>

          <div
            className={
              compact
                ? "flex flex-wrap items-center gap-x-8 gap-y-3 text-sm"
                : "grid gap-x-12 gap-y-5 md:grid-cols-3"
            }
          >
            <FactBlock
              icon={<MapPin className="h-4 w-4" />}
              label="Field Name"
              value={record.fieldName}
            />
            <FactBlock label="Field Code" value={record.fieldCode} />
            <FactBlock label="Crop Type" value={record.cropTypeName ?? record.block} />
            <FactBlock
              icon={<Tag className="h-4 w-4" />}
              label="Contract No"
              value={record.contractNo}
            />
            <FactBlock label="Header No" value={record.headerNo} />
            <FactBlock label="Sex Expression" value={record.sexExpression} />
          </div>
        </div>
      </section>

      <CropDataDetail record={record} farmId={selectedFarmId} activeTab={activeTab} />
    </div>
  );
}

function FactBlock({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
    </div>
  );
}
