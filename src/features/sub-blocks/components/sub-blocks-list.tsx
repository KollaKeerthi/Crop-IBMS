"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useSubBlocks, useDeleteSubBlock } from "../hooks";
import type { SubBlock } from "../schema";
import { SubBlockForm } from "./sub-block-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Props = {
  blockId: string;
  farmId: string;
  blockName: string;
};

export function SubBlocksList({ blockId, farmId, blockName }: Props) {
  const { data: subBlocks, isLoading } = useSubBlocks(blockId, farmId);
  const deleteMutation = useDeleteSubBlock();
  const [createOpen, setCreateOpen] = useState(false);
  const [editSubBlock, setEditSubBlock] = useState<SubBlock | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync({ id, farmId, blockId });
      toast.success("Sub-block deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete sub-block");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          Sub-blocks of {blockName}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Sub-block
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Name</th>
              <th className="px-3 py-2 text-left font-medium">Rows</th>
              <th className="px-3 py-2 text-left font-medium">Length (m)</th>
              <th className="px-3 py-2 text-left font-medium">Width (m)</th>
              <th className="px-3 py-2 text-left font-medium">Area (m²)</th>
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {subBlocks && subBlocks.length > 0 ? (
              subBlocks.map((sb) => (
                <tr key={sb.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{sb.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{sb.rows ?? "-"}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {sb.rowLengthM != null ? sb.rowLengthM.toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {sb.rowWidthM != null ? sb.rowWidthM.toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {sb.areaSqm != null ? sb.areaSqm.toLocaleString() : "-"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditSubBlock(sb)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setDeletingId(sb.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground text-xs">
                  No sub-blocks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Sub-block to {blockName}</DialogTitle>
          </DialogHeader>
          <SubBlockForm blockId={blockId} farmId={farmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editSubBlock} onOpenChange={(o) => !o && setEditSubBlock(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-block</DialogTitle>
          </DialogHeader>
          {editSubBlock && (
            <SubBlockForm
              blockId={blockId}
              farmId={farmId}
              subBlock={editSubBlock}
              onSuccess={() => setEditSubBlock(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Sub-block</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this sub-block? This action cannot be undone.
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
