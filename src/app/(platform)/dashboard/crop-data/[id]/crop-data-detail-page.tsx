"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, Box, Calendar, ChevronUp, Download, MapPin, Tag } from "lucide-react";
import { toast } from "sonner";
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

  async function handleExport() {
    if (!selectedFarmId) return;
    try {
      const res = await fetch(
        `/api/v1/crop-data/${id}/export?farmId=${encodeURIComponent(selectedFarmId)}`
      );
      if (!res.ok) {
        toast.error("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crop-data-${id}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  }

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
  const inventoryCode = record.customerCode ?? record.contractRef ?? record.id.slice(0, 6);

  return (
    <div className="w-full space-y-6 p-6">
      <section className="border-b bg-background">
        <div className="flex items-start justify-between gap-4 pb-6">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" render={<Link href="/dashboard/crop-data" />}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <span>Inventory</span>
                <span>/</span>
                <span className="text-primary">{inventoryCode}</span>
              </div>
              <div className="flex flex-wrap items-center gap-5">
                <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border bg-muted">
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
                  <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
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
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
          >
            Compact View
            <ChevronUp className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-6 border-t py-6 md:grid-cols-3">
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
        <div className="flex justify-end pb-4">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
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
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground">{value || "-"}</div>
    </div>
  );
}
