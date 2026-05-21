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
    block?: string | null;
    fieldName?: string | null;
    sexExpression?: string | null;
    contractNo?: string | null;
    status?: string | null;
    notes?: string | null;
    createdAt?: string;
    programInfo: Record<string, unknown> | null;
    nursery: Record<string, unknown> | null;
    modules: Array<{ moduleType: string; data: Record<string, unknown> }>;
  };

  const displayName =
    record.cropName ??
    (record.block ? `${record.block}` : null) ??
    record.id.slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/dashboard/crop-data" className="hover:text-foreground transition-colors">
          Crop Data
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{displayName}</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          {record.status && (
            <p className="text-sm text-muted-foreground capitalize">Status: {record.status}</p>
          )}
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <CropDataDetail record={record} farmId={selectedFarmId} activeTab={activeTab} />
    </div>
  );
}
