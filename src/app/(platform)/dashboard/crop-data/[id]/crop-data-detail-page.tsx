"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
  const cropTitleParts = [record.cropName, record.varietyName].filter(Boolean);
  const displayName = cropTitleParts.length > 0 ? cropTitleParts.join(" - ") : "-";
  const detailCode = record.customerCode ?? record.contractRef ?? record.id.slice(0, 6);
  const cropVarietyCode = [record.cropName, record.varietyName, detailCode]
    .filter(Boolean)
    .join("-");
  const breadcrumbText = ["Crop Data", record.block, cropVarietyCode].filter(Boolean).join(" / ");
  const metadataItems = [
    { label: "Block", value: record.block },
    { label: "Season", value: record.seasonName },
    { label: "Contract Number", value: record.contractNo },
    { label: "Field", value: record.fieldName ?? record.fieldCode },
    { label: "Crop Type", value: record.cropTypeName },
    { label: "Sex Expression", value: record.sexExpression },
  ];
  const backButton = (
    <Button
      variant="outline"
      size="icon"
      className="size-8 shrink-0 rounded-sm border-[var(--erp-border)] bg-white"
      render={<Link href="/dashboard/crop-data" />}
    >
      <ArrowLeft className="size-4" />
    </Button>
  );
  const cropImage = (
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
  );

  return (
    <div className="crop-data-module w-full bg-[var(--erp-canvas)] px-4 pb-4 pt-3">
      <div className="sticky top-0 z-10 bg-[var(--erp-canvas)]">
        <div className="crop-helper-text border-b border-[var(--erp-border)] pb-2 text-[var(--erp-muted)]">
          {breadcrumbText}
        </div>
      </div>

      <section className="w-full border-b border-[var(--erp-border)] bg-[var(--erp-canvas)] py-4">
        <header className="w-full">
          <div className="flex w-full min-w-0 items-center gap-3">
            {backButton}
            {cropImage}
            <div className="min-w-0 flex-1">
              <h1
                className="crop-card-title whitespace-normal break-words font-bold"
                title={displayName}
              >
                {displayName}
              </h1>
            </div>
          </div>

          <div className="mt-3 flex w-full flex-wrap items-center gap-x-5 gap-y-2 sm:pl-[6.5rem]">
            {metadataItems.map((item) => (
              <HeaderMetaItem key={item.label} {...item} />
            ))}
          </div>
        </header>
      </section>

      <CropDataDetail record={record} farmId={selectedFarmId} activeTab={activeTab} />
    </div>
  );
}

function HeaderMetaItem({ label, value }: { label: string; value: string | null | undefined }) {
  const displayValue = value || "-";

  return (
    <div
      title={`${label}: ${displayValue}`}
      className="inline-flex max-w-full flex-[0_1_auto] items-baseline gap-1.5 whitespace-normal"
    >
      <span className="crop-helper-text shrink-0 leading-tight text-[var(--erp-muted)]">
        {label}
      </span>
      <span className="crop-body-text min-w-0 break-words font-semibold">{displayValue}</span>
    </div>
  );
}
