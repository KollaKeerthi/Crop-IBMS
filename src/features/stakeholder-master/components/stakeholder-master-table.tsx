"use client";

import { useState } from "react";
import { Pencil, Trash2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { useFarm } from "@/lib/farm-context";
import { useStakeholderMaster, useDeleteStakeholder } from "../hooks";
import type { Stakeholder } from "../schema";
import { StakeholderForm } from "./stakeholder-form";
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

export function StakeholderMasterTable() {
  const { selectedFarmId } = useFarm();
  const { data: stakeholders, isLoading } = useStakeholderMaster(selectedFarmId);
  const deleteMutation = useDeleteStakeholder(selectedFarmId ?? "");
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<Stakeholder | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!selectedFarmId) {
    return <p className="text-sm text-muted-foreground">Select a farm to manage stakeholders.</p>;
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("Stakeholder deleted");
      setDeletingId(null);
    } catch {
      toast.error("Failed to delete stakeholder");
    }
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Stakeholder"
        description="Define the stakeholders associated with your farming operations."
        count={stakeholders?.length ?? 0}
        countUnit="stakeholders"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stakeholder
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : stakeholders && stakeholders.length > 0 ? (
        <div className="overflow-auto rounded-md border max-h-[calc(100vh-280px)]">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-background">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stakeholders.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-semibold text-foreground">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-md">
                    {s.description ?? <span className="text-muted-foreground/50 italic">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditItem(s)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingId(s.id)}>
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
          icon={Users}
          title="No stakeholders yet"
          description="Add stakeholders to associate them with density records and variety codes."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stakeholder
            </Button>
          }
        />
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Stakeholder</DialogTitle>
          </DialogHeader>
          <StakeholderForm farmId={selectedFarmId} onSuccess={() => setCreateOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={(o) => !o && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Stakeholder</DialogTitle>
          </DialogHeader>
          {editItem && (
            <StakeholderForm
              farmId={selectedFarmId}
              stakeholder={editItem}
              onSuccess={() => setEditItem(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stakeholder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this stakeholder? This action cannot be undone.
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
