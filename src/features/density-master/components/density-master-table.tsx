"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Boxes } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useDensityMaster, useDeleteDensityMaster } from "../hooks";
import { useCrops } from "@/features/crops";
import { useProductionTypes } from "@/features/production-types";
import type { DensityMaster } from "../schema";
import { DensityForm } from "./density-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function DensityMasterTable() {
  const { selectedFarmId } = useFarm();
  const { data: densities, isLoading } = useDensityMaster(selectedFarmId);
  const { data: crops = [] } = useCrops();
  const { data: productionTypes = [] } = useProductionTypes();
  const deleteMutation = useDeleteDensityMaster(selectedFarmId ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editDensity, setEditDensity] = useState<DensityMaster | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage density master.</p>;
  }

  const cropName = (id: string | null) => crops.find((c) => c.id === id)?.name ?? "-";
  const cropTypeName = (cropId: string | null, typeId: string | null) => {
    if (!cropId || !typeId) return "-";
    const crop = crops.find((c) => c.id === cropId);
    return crop?.types.find((t) => t.id === typeId)?.name ?? "-";
  };
  const productionTypeName = (id: string | null) =>
    productionTypes.find((t) => t.id === id)?.code ?? "-";

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Density record deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete density record");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Density"
        description="Planting density reference values for each crop × production type combination."
        count={densities?.length ?? 0}
        countUnit="records"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : densities && densities.length > 0 ? (
        <div className="overflow-auto rounded-md border max-h-[calc(100vh-280px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Crop Type</TableHead>
                <TableHead>Production Type</TableHead>
                <TableHead>Female Density</TableHead>
                <TableHead>Male Density</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Validity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {densities.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold text-foreground">
                    {cropName(d.cropId)}
                  </TableCell>
                  <TableCell>{cropTypeName(d.cropId, d.cropTypeId)}</TableCell>
                  <TableCell>{productionTypeName(d.productionTypeId)}</TableCell>
                  <TableCell>{d.femaleDensity ?? "-"}</TableCell>
                  <TableCell>{d.maleDensity ?? "-"}</TableCell>
                  <TableCell>{d.year ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">
                    W{String(d.validFrom).padStart(2, "0")} – W{String(d.validTo).padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditDensity(d)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingId(d.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={Boxes}
          title="No density records yet"
          description="Planting density reference for each crop × production type combination."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Density Record</DialogTitle>
          </DialogHeader>
          <DensityForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editDensity} onOpenChange={(o) => !o && setEditDensity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Density Record</DialogTitle>
          </DialogHeader>
          {editDensity && (
            <DensityForm
              farmId={selectedFarmId}
              density={editDensity}
              onSuccess={() => setEditDensity(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Density Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this density record?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deletingId && handleDelete(deletingId)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
