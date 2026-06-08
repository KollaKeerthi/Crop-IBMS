"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Activity } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useVariability, useDeleteVariability } from "../hooks";
import { useProductionTypes } from "@/features/production-types";
import type { Variability } from "../schema";
import { VariabilityForm } from "./variability-form";
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

export function VariabilityTable() {
  const { selectedFarmId } = useFarm();
  const { data: variabilities, isLoading } = useVariability(selectedFarmId);
  const { data: productionTypes } = useProductionTypes();
  const deleteMutation = useDeleteVariability(selectedFarmId);
  const [createOpen, setCreateOpen] = useState(false);
  const [editVariability, setEditVariability] = useState<Variability | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage variability.</p>;
  }

  const getProductionTypeCode = (id: string) => {
    return productionTypes?.find((pt) => pt.id === id)?.code ?? "-";
  };

  const getProductionTypeDescription = (id: string) => {
    return productionTypes?.find((pt) => pt.id === id)?.description ?? "";
  };

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Variability record deleted successfully");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete variability record");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Variability"
        description="Configure whether production type cycles have fixed or flexible schedules."
        count={variabilities?.length ?? 0}
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
      ) : variabilities && variabilities.length > 0 ? (
        <div className="overflow-auto rounded-md border max-h-[calc(100vh-280px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Production Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Variability Kind</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variabilities.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-semibold text-foreground">
                    {getProductionTypeCode(v.productionTypeId)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {getProductionTypeDescription(v.productionTypeId) || "-"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        v.variability === "Fixed"
                          ? "bg-blue-50 text-blue-700 ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/20"
                          : "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20"
                      }`}
                    >
                      {v.variability}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditVariability(v)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingId(v.id)}>
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
          icon={Activity}
          title="No variability records yet"
          description="Configure whether production types have fixed or flexible cycle lengths."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Record
            </Button>
          }
        />
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Variability Record</DialogTitle>
          </DialogHeader>
          <VariabilityForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editVariability} onOpenChange={(o) => !o && setEditVariability(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Variability Record</DialogTitle>
          </DialogHeader>
          {editVariability && (
            <VariabilityForm
              farmId={selectedFarmId}
              variabilityRecord={editVariability}
              onSuccess={() => setEditVariability(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Variability Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this variability record? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-4">
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
