"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, FileText, MapPin, Tag } from "lucide-react";
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
  const [expanded, setExpanded] = useState(false);

  if (!selectedFarmId) {
    return <p className="p-6 text-xs text-[var(--erp-muted)]">Select a farm to view crop data.</p>;
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="w-full p-6">
        <p className="text-xs text-destructive">Crop data record not found.</p>
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
    <div className="w-full bg-[var(--erp-canvas)] px-4 pb-4 pt-3">
      <section className="border-b border-[var(--erp-border)] bg-[var(--erp-canvas)] pb-3">
        <div className="flex min-h-20 items-center gap-2 overflow-hidden">
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-sm border-[var(--erp-border)] bg-white"
            render={<Link href="/dashboard/crop-data" />}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <p className="min-w-32 max-w-56 truncate text-xs font-semibold text-[var(--erp-muted)]">
            {breadcrumbText}
          </p>

          <div className="size-12 shrink-0 overflow-hidden rounded-sm border border-[var(--erp-border)] bg-white">
            {record.cropImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.cropImageUrl}
                alt={record.cropName ?? "Crop"}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>

          <h1 className="min-w-36 max-w-52 truncate text-sm font-bold text-[var(--erp-ink)]">
            {displayName}
          </h1>
          <span className="shrink-0 bg-[var(--erp-green-muted)] px-2 py-1 text-[0.62rem] font-bold uppercase text-primary">
            Active Cycle
          </span>
          <CompactFact label="Block" value={record.block} />
          <CompactFact label="Season" value={record.seasonName} />
          <CompactFact label="Contract Number" value={record.contractNo} />
          <CompactFact label="Field" value={record.fieldName} />
          <CompactFact label="Crop Type" value={record.cropTypeName ?? record.block} />
          <CompactFact label="Sex Expression" value={record.sexExpression} />

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex shrink-0 items-center gap-2 px-2 text-[0.68rem] font-bold uppercase tracking-widest text-[var(--erp-muted)]"
          >
            {expanded ? "Expanded View" : "Compact View"}
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
        </div>

        {expanded ? (
          <div className="mt-4 grid gap-5 border-t border-[var(--erp-border)] pt-4 lg:grid-cols-[8rem_minmax(0,1fr)]">
            <div className="h-28 w-28 shrink-0 overflow-hidden rounded-sm border border-[var(--erp-border)] bg-white">
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
              <h1 className="text-2xl font-bold leading-tight text-[var(--erp-ink)]">
                {displayName}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--erp-muted)]">
                <span>{record.block ?? "-"}</span>
                <span>{record.seasonName ?? "-"}</span>
              </div>
              <div className="mt-5 grid gap-x-12 gap-y-5 md:grid-cols-3">
                <FactBlock
                  icon={<MapPin className="size-4" />}
                  label="Field Name"
                  value={record.fieldName}
                />
                <FactBlock label="Field Code" value={record.fieldCode} />
                <FactBlock label="Crop Type" value={record.cropTypeName ?? record.block} />
                <FactBlock
                  icon={<Tag className="size-4" />}
                  label="Contract No"
                  value={record.contractNo}
                />
                <FactBlock
                  icon={<FileText className="size-4" />}
                  label="Header No"
                  value={record.headerNo}
                />
                <FactBlock label="Sex Expression" value={record.sexExpression} />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <CropDataDetail record={record} farmId={selectedFarmId} activeTab={activeTab} />
    </div>
  );
}

function CompactFact({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string | null | undefined;
  strong?: boolean;
}) {
  return (
    <div className="min-w-20 max-w-32 shrink truncate text-[0.65rem] font-semibold">
      <span className="mr-1 text-[var(--erp-muted)]">{label}</span>
      <span
        className={strong ? "truncate text-[var(--erp-ink)]" : "truncate text-[var(--erp-ink)]"}
      >
        {value || "-"}
      </span>
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
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--erp-muted)]">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-[var(--erp-ink)]">{value || "-"}</div>
    </div>
  );
}
