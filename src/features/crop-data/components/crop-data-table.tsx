"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useCropDataList, useDeleteCropData } from "../hooks";
import { CropDataForm } from "./crop-data-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Database } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CropDataTable() {
  const { selectedFarmId } = useFarm();
  const router = useRouter();
  const { data: records, isLoading } = useCropDataList(selectedFarmId);
  const deleteMutation = useDeleteCropData();
  const [createOpen, setCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to view crop data.</p>;
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync({ id, farmId: selectedFarmId! });
      toast.success("Record deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete record");
    }
  }

  const recordCount = records?.length ?? 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Crop Programs"
        description="Track every program - from nursery to harvest - for your selected farm."
        count={recordCount}
        countUnit="programs"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Program
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : records && records.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Crop</TableHead>
              <TableHead>Variety</TableHead>
              <TableHead>Season</TableHead>
              <TableHead>Block</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Sex Expression</TableHead>
              <TableHead>Contract No</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(
              records as Array<{
                id: string;
                cropName: string | null;
                varietyName: string | null;
                seasonName: string | null;
                block: string | null;
                fieldName: string | null;
                sexExpression: string | null;
                contractNo: string | null;
                status: string | null;
              }>
            ).map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-semibold text-foreground">
                  {row.cropName ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.varietyName ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">{row.seasonName ?? "-"}</TableCell>
                <TableCell>{row.block ?? "-"}</TableCell>
                <TableCell>{row.fieldName ?? "-"}</TableCell>
                <TableCell>
                  {row.sexExpression ? (
                    <Badge variant="outline">{row.sexExpression}</Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.contractNo ?? "-"}</TableCell>
                <TableCell>
                  {row.status ? (
                    <Badge variant={row.status === "active" ? "default" : "secondary"}>
                      {row.status}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/dashboard/crop-data/${row.id}`)}
                      aria-label="View record"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingId(row.id)}
                      aria-label="Delete record"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <EmptyState
          icon={Database}
          title="No crop programs yet"
          description="Create a program to track planting, nursery, harvest, and production data for a crop."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Program
            </Button>
          }
        />
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Program</DialogTitle>
          </DialogHeader>
          <CropDataForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this crop data record? This action cannot be undone.
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
