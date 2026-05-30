"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Download, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useCropDataDetail } from "@/features/crop-data/hooks";
import { CropDataDetail } from "@/features/crop-data/components/crop-data-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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
    return <p className="text-sm text-muted-foreground p-8">Select a farm to view crop data.</p>;
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 p-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl p-8">
        <p className="text-sm text-destructive">Crop data record not found.</p>
      </div>
    );
  }

  const record = data as {
    id: string;
    farmId: string;
    cropId?: string | null;
    cropName?: string | null;
    cropTypeName?: string | null;
    varietyName?: string | null;
    seasonName?: string | null;
    cropImageUrl?: string | null;
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

  const displayName =
    record.customerCode ?? record.cropName ?? record.block ?? record.id.slice(0, 8);

  const leftFacts: { label: string; value: string | null | undefined }[] = [
    { label: "Block", value: record.block },
    { label: "Crop Name", value: record.cropName },
    { label: "Crop Type", value: record.cropTypeName },
    { label: "Variety", value: record.varietyName },
    { label: "Sex Expression", value: record.sexExpression },
    { label: "Season", value: record.seasonName },
  ];
  const rightFacts: { label: string; value: string | null | undefined }[] = [
    { label: "Field Name", value: record.fieldName },
    { label: "Field Code", value: record.fieldCode },
    { label: "Contract", value: record.contractNo },
    { label: "Header", value: record.headerNo },
    { label: "Customer Code", value: record.customerCode },
    { label: "Contract Ref", value: record.contractRef },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground">
          <Link href="/dashboard/crop-data" className="hover:text-foreground transition-colors">
            Crop Data
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{displayName}</span>
        </nav>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Header summary card */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex gap-4 rounded-xl border bg-muted/30 p-5">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-background">
            {record.cropImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={record.cropImageUrl}
                alt={record.cropName ?? "Crop"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl">🌱</div>
            )}
          </div>
          <dl className="grid flex-1 grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {leftFacts.map((f) => (
              <FactRow key={f.label} label={f.label} value={f.value} />
            ))}
          </dl>
        </div>
        <div className="rounded-xl border bg-muted/30 p-5">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            {rightFacts.map((f) => (
              <FactRow key={f.label} label={f.label} value={f.value} />
            ))}
          </dl>
        </div>
      </div>

      <CropDataDetail record={record} farmId={selectedFarmId} activeTab={activeTab} />
    </div>
  );
}

function FactRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="font-semibold text-foreground">{value || "-"}</dd>
    </>
  );
}
