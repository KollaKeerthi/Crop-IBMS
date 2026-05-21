"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useBlockMaster, useDeleteBlockMaster } from "../hooks";
import type { BlockMaster } from "../schema";
import { BlockForm } from "./block-form";
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Block</TableHead>
              <TableHead>Sub-Block</TableHead>
              <TableHead>Area (sqm)</TableHead>
              <TableHead>Rows</TableHead>
              <TableHead>Row Length (m)</TableHead>
              <TableHead>Row Width (m)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {blocks.map((block) => (
              <TableRow key={block.id}>
                <TableCell className="font-semibold text-foreground">{block.blockName}</TableCell>
                <TableCell className="text-muted-foreground">{block.subBlockName ?? "—"}</TableCell>
                <TableCell>{block.areaSqm ?? "—"}</TableCell>
                <TableCell>{block.rows ?? "—"}</TableCell>
                <TableCell>{block.rowLengthM ?? "—"}</TableCell>
                <TableCell>{block.rowWidthM ?? "—"}</TableCell>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
          </DialogHeader>
          <BlockForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editBlock} onOpenChange={(o) => !o && setEditBlock(null)}>
        <DialogContent className="max-w-lg">
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
