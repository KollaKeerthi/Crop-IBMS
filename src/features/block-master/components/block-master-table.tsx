"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useBlockMaster, useDeleteBlockMaster } from "../hooks";
import type { BlockMaster } from "../schema";
import { BlockForm } from "./block-form";
import { useCrops } from "@/features/crops/hooks";
import { useSeasons } from "@/features/seasons/hooks";
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
import { LayoutGrid } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function BlockMasterTable() {
  const { selectedFarmId } = useFarm();
  const { data: blocks, isLoading } = useBlockMaster(selectedFarmId);
  const { data: crops = [] } = useCrops();
  const { data: seasons = [] } = useSeasons(selectedFarmId);
  const deleteMutation = useDeleteBlockMaster(selectedFarmId ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editBlock, setEditBlock] = useState<BlockMaster | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage blocks.</p>;
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Block deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete block");
    }
  }

  function suitableCropsLabel(block: BlockMaster) {
    const suitableCrops = block.suitableCrops ?? [];
    if (suitableCrops.length === 0) return "-";

    return suitableCrops
      .map((item) => {
        const cropId = typeof item === "string" ? item : item.cropId;
        const cropName = crops.find((crop) => crop.id === cropId)?.name ?? cropId;
        if (typeof item === "string") return cropName;
        const seasonNames =
          item.seasonIds
            ?.map((seasonId) => seasons.find((season) => season.id === seasonId)?.name)
            .filter(Boolean)
            .join(", ") ?? "";
        const seasonLabel = seasonNames ? ` (${seasonNames})` : "";
        return `${cropName}${seasonLabel}: ${item.rows} rows, ${item.plantsPerRow} plants / row`;
      })
      .join("; ");
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Blocks"
        description="Define the planting blocks and their sub-block dimensions for this farm."
        count={blocks?.length ?? 0}
        countUnit="blocks"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : blocks && blocks.length > 0 ? (
        <div className="overflow-auto rounded-md border max-h-[calc(100vh-280px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Block</TableHead>
                <TableHead>Area (m2)</TableHead>
                <TableHead>Suitable Crops</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocks.map((block) => (
                <TableRow key={block.id}>
                  <TableCell className="font-semibold text-foreground">{block.blockName}</TableCell>
                  <TableCell>{block.areaSqm ?? "-"}</TableCell>
                  <TableCell className="max-w-130 truncate text-muted-foreground">
                    {suitableCropsLabel(block)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditBlock(block)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingId(block.id)}>
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
          icon={LayoutGrid}
          title="No blocks yet"
          description="Define planting blocks and their sub-block dimensions for this farm."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Block
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
          </DialogHeader>
          <BlockForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBlock} onOpenChange={(o) => !o && setEditBlock(null)}>
        <DialogContent className="max-h-[90vh] max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Block</DialogTitle>
          </DialogHeader>
          {editBlock && (
            <BlockForm
              farmId={selectedFarmId}
              block={editBlock}
              onSuccess={() => setEditBlock(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Block</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this block?
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
